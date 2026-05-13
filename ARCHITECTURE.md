# Target Architecture — AI Video Creator

Дата: 2026-05-14
Цель: максимально эффективная и модульная архитектура для масштабирования.

Главный сдвиг: убрать polling, опереться на webhooks + push, денормализовать read-модели, изолировать модули через явные контракты.

---

## 1. Архитектурные принципы

1. **БД — единственный источник правды.** Никаких внешних API вызовов в read-paths (polling должен читать только Postgres).
2. **Push, не Pull.** SSE/WebSocket вместо `setInterval` — клиент подписывается, сервер отправляет события когда есть изменение.
3. **CQRS-light.** Write-команды через service layer с транзакциями, Read через денормализованные view-модели (быстрые SELECT).
4. **Изоляция модулей.** Каждая фича — пакет с явным API. Запрет на cross-import внутренностей.
5. **Edge-first для read.** Картинки/видео/публичный контент — через CDN с долгим TTL. Динамические данные — близко к пользователю.

---

## 2. Структура (модульный монолит)

```
apps/
  web/            ← Next.js (только UI + thin BFF)
  worker/         ← Long-running jobs (FFmpeg, экспорт, ретраи)
  webhook/        ← Отдельный handler для Fal/Stripe (изолированный)

packages/
  domain/         ← Чистые модели и инварианты (Project, Scene, Job)
  application/    ← Use-cases (CreateScene, GenerateVideo, ApplyWebhook)
  infrastructure/
    prisma/       ← Только репозитории
    storage/      ← R2/S3 абстракция
    providers/    ← Fal, Stripe (одна точка входа на провайдера)
    cache/        ← Redis/KV абстракция
    realtime/     ← SSE/Pusher/Ably
  contracts/      ← Zod-схемы + типы, шарятся между client/server
  ui-kit/         ← Дизайн-система
  features/
    editor/
    photo-library/
    ai-creator/
    billing/
```

**Правило:** `features/*` не импортирует другой `features/*` напрямую — только через `application` use-cases или events.

---

## 3. Поток данных — пример "генерация видео"

```
[Client] ──POST /api/scenes/:id/generate──> [Web BFF]
                                                │
                                                ▼
                                     [application: GenerateVideoCommand]
                                                │
                              ┌─────────────────┼─────────────────┐
                              ▼                 ▼                 ▼
                       reserveCredits()   createJob()     enqueue(JobQueue)
                                                                  │
                                                                  ▼
                                                          [Worker / Edge Function]
                                                                  │
                                                                  ▼
                                                          submitFalJob() → Fal
                                                                  │
                                                                  ▼
              ┌─── Fal webhook ──> [/webhook/fal] ─── persists to DB ─── publishes event ───┐
              │                                                                              │
              ▼                                                                              ▼
       [JobQueue retry если упало]                                          [Realtime channel: project:{id}]
                                                                                             │
                                                                                             ▼
                                                                              [Client SSE subscription]
                                                                                             │
                                                                                             ▼
                                                                              router.refresh() / patch state
```

**Никакого polling.** Клиент держит одну SSE подписку на `project:{id}`. Сервер шлёт `scene.updated`, `job.completed` события.

---

## 4. Database — что меняется

```prisma
model User {
  ...
  creditBalance   Int     @default(0)   // ← денормализованный, обновляется в транзакции с CreditLedger
}

model Project {
  ...
  sceneCount             Int @default(0)   // ← денормализованный
  totalDurationSeconds   Int @default(0)   // уже есть, начать использовать
  coverAssetSignedUrl    String?           // pre-resolved кэш
}

model Asset {
  ...
  cdnUrl          String?     // публичный CDN URL для read-only assets (cached)
  signedUrlCache  Json?       // { url, expiresAt } — короткий кэш на стороне DB
}

model OutboxEvent {            // ← НОВОЕ: Transactional Outbox
  id, type, payload, processedAt, createdAt
}
```

**Outbox pattern:** все доменные события (`SceneCreated`, `JobCompleted`) пишутся в Outbox в той же транзакции что и основной апдейт, затем worker их публикует в realtime. Гарантирует at-least-once без потерь.

---

## 5. Слои стека

| Слой | Что | Зачем |
|------|-----|-------|
| **Edge** | Cloudflare Workers / Vercel Edge | Auth verify, читающие эндпоинты, CDN |
| **API (Node)** | Next.js route handlers (тонкие) | Только парсинг + вызов use-case |
| **Application** | Use-cases, command handlers | Бизнес-логика, транзакции |
| **Domain** | Чистые entities + invariants | Тестируемая ядро без зависимостей |
| **Infrastructure** | Prisma, R2, Fal, Redis | Имплементации интерфейсов |
| **Worker** | BullMQ / inngest / trigger.dev | Долгие задачи, retries, scheduled |
| **Realtime** | Pusher / Ably / SSE | Push к клиенту |
| **Cache** | Redis (KV) | Сессии, presigned URLs, hot data |

---

## 6. Конкретные технологические решения

- **Auth**: остаётся JWT в cookie, но `verifySession` обёрнут в `React.cache()` и Redis-кэш на 60с.
- **Pre-signed URLs**: генерируются батчем при загрузке проекта, кэш в Redis на 10 мин, клиент получает готовые URL.
- **Очередь**: BullMQ (Redis) или **inngest/trigger.dev** (managed) — declarative jobs, встроенные retries, observability.
- **Realtime**: SSE для простоты (один HTTP/2 connection) или Ably/Pusher для скейла.
- **Биллинг**: материализованный `creditBalance` в User, транзакционно обновляется. CreditLedger остаётся для аудита.
- **Картинки**: `next/image` + Cloudflare Images derivative (resize on-the-fly).
- **Бандл**: `optimizePackageImports: ['lucide-react', '@dnd-kit/core']`, динамические импорты для тяжёлых модалок (AI Creator, PhotoLibrary).
- **Тесты**: domain layer покрыт unit-тестами, application — интеграционными с Testcontainers Postgres.
- **Observability**: OpenTelemetry → Sentry/Axiom. Tracing на каждый use-case.

---

## 7. Что это даёт vs текущее

| Метрика | Сейчас | Стало бы |
|---|---|---|
| Запросов к Fal/poll | N сцен × частота | 0 (только webhook) |
| Запросов на открытие проекта | 1 + 40 (signed urls) | 1 |
| Latency `getCreditBalance` | O(N ledger entries) | O(1) |
| Connection pool | 1 | 20+ через pgBouncer |
| Время до видимости статуса | до 5 сек (poll) | <500мс (push) |
| Cross-feature импорты | Свободные | Запрещены линтером |
| Тестируемость core логики | Нужна БД | Чистые unit-тесты |

---

## 8. Главный tradeoff

Это значительно больше **операционной сложности**: Redis, очередь, realtime-провайдер, outbox worker. Для проекта в одиночку или с 3 пользователями — overkill. Окупается с ~100 активных юзеров и/или когда генерация становится горлышком (что у вас уже сейчас).

---

## 9. Минимально жизнеспособная версия (поэтапная миграция)

Если не переписывать всё, а двигаться итеративно:

1. **`connection_limit=10`** + Redis для кэша signed URLs
2. **SSE endpoint** вместо polling (1 файл, заменяет 3 hook'а)
3. **Денормализация** `creditBalance` + `sceneCount`
4. **`React.cache()`** + `Promise.all` в server components
5. **Outbox + worker** — позже, когда понадобится

Каждый шаг даёт измеримый выигрыш и не блокирует следующий. Полное переписывание не требуется.

---

## 10. Граничные принципы для будущего кода

- **Use-case = 1 файл, 1 функция, 1 транзакция.** Нет растекания логики по сервисам.
- **Репозиторий не возвращает Prisma-типы наружу.** Только domain entities. Это разрешает менять ORM без боли.
- **API route = парсинг + вызов use-case + сериализация.** Никакой логики в route.ts.
- **Events first.** Если что-то меняет состояние — публикуй событие, даже если сейчас никто не слушает.
- **No feature flags в коде дольше 2 недель.** Либо включаешь, либо удаляешь.
- **Read-модели можно денормализовать без угрызений.** Write-модели — нормализованы и валидны.

---

## 11. Database changes

Главное направление: **денормализовать read-модели, разделить смешанные сущности, добавить инварианты на уровне БД.**

### 11.1. User — материализованные счётчики

```prisma
model User {
  ...
  creditBalance     Int       @default(0)   // вместо aggregate из CreditLedger
  storageBytesUsed  BigInt    @default(0)   // вместо aggregate из Asset
  projectCount      Int       @default(0)
  lastActiveAt      DateTime?
}
```

Обновляются транзакционно в той же tx где write. **CreditLedger остаётся для аудита.**

### 11.2. Asset — разделить storage origin от ключа

Сейчас `storageKey` хранит либо R2-key, либо `http://...` (внешний URL). Это нарушенный инвариант — везде проверки `startsWith("http")`.

```prisma
model Asset {
  id                String        @id
  origin            AssetOrigin                  // R2 | EXTERNAL_URL | PENDING
  r2Key             String?                       // если origin=R2
  externalUrl       String?                       // если origin=EXTERNAL_URL
  // + check constraint: exactly one не null

  width, height, durationSeconds, mimeType, sizeBytes — типизировать строже
  cdnUrl            String?                       // публичный URL после миграции на CDN

  metadata          Json?                         // оставить для гибкости
}
```

### 11.3. Scene — явные relations вместо голых FK

Сейчас `startFrameAssetId`, `videoAssetId`, `endFrameAssetId` — просто `String?`, без relation. Удалили ассет → битая ссылка.

```prisma
model Scene {
  ...
  startFrameAsset   Asset?  @relation("SceneStartFrame", fields: [startFrameAssetId], references: [id], onDelete: SetNull)
  videoAsset        Asset?  @relation("SceneVideo", fields: [videoAssetId], references: [id], onDelete: SetNull)
  endFrameAsset     Asset?  @relation("SceneEndFrame", fields: [endFrameAssetId], references: [id], onDelete: SetNull)

  parentScene       Scene?  @relation("SceneBranch", fields: [parentSceneId], references: [id], onDelete: SetNull)
  branch            SceneBranch?  @relation(fields: [branchId], references: [id])
}

model SceneBranch {                  // ← вынести AI Creator sequence в отдельную сущность
  id          String   @id
  projectId   String
  kind        String                 // "ai_creator", "manual_continue"
  status      String                 // GENERATING | READY | FAILED
  totalScenes Int
  readyScenes Int      @default(0)
  createdAt   DateTime @default(now())
  scenes      Scene[]

  @@index([projectId, status])
}
```

Сейчас "sequence" живёт как строковый префикс в `branchId` (`ai_creator_sequence_xxx`). Это анти-паттерн — становится сущностью первого класса.

### 11.4. GenerationJob — структурировать вместо трёх Json

```prisma
model GenerationJob {
  ...
  // Вместо inputJson/outputJson/errorJson:
  input             Json
  result            JobResult?  @relation                  // отдельная таблица
  error             JobError?   @relation

  // Денормализованные поля для быстрых запросов:
  estimatedCredits  Int
  actualCredits     Int?
  durationMs        Int?         // время генерации для аналитики
}

model JobResult {
  jobId       String   @id
  assets      Json                       // массив создаваемых ассетов
  rawResponse Json                       // полный ответ Fal — для дебага
}
```

Меньше пустых колонок, лучше для индексов и аналитики.

### 11.5. Project — счётчики и cover

```prisma
model Project {
  ...
  sceneCount             Int     @default(0)   // обновляется триггером/use-case
  readySceneCount        Int     @default(0)
  timelineItemCount      Int     @default(0)
  totalDurationSeconds   Int     @default(0)   // УЖЕ ЕСТЬ, начать использовать

  coverAssetId          String?
  coverAsset            Asset?   @relation(...)
}
```

Это убирает все `include: { scenes: true }` для подсчёта.

### 11.6. AiModel — разделить storage от catalog

Сейчас половина полей в коде (`catalog.ts`), половина в БД, мешаются через `mergeModel`. Логика разваливается на сопоставлении по `key`.

Варианты:
- **A.** Полностью в БД, catalog только как seed
- **B.** Полностью в коде, БД хранит только usage stats (`requestCount`, `lastUsedAt`)

Выбор: **B** — модели меняются редко, через релиз. БД содержит только то что меняется per-user или per-day:

```prisma
model AiModelStats {
  key                     String   @id
  usageRequestCount       Int      @default(0)
  usageGeneratedImages    Int      @default(0)
  lastUsedAt              DateTime?
  pricePerSecondOverride  Json?     // override из admin UI
  active                  Boolean   @default(true)
  selected                Boolean   @default(false)
}
```

### 11.7. Outbox — новая таблица для event-driven

```prisma
model OutboxEvent {
  id          String    @id @default(cuid())
  aggregateId String                          // projectId / userId / etc
  type        String                          // "scene.completed", "job.failed"
  payload     Json
  publishedAt DateTime?
  createdAt   DateTime  @default(now())

  @@index([publishedAt, createdAt])           // быстро найти не-опубликованные
  @@index([aggregateId, createdAt])           // история событий по агрегату
}
```

Worker читает не-опубликованные, шлёт в SSE/realtime, помечает.

### 11.8. WebhookEvent — TTL и партиционирование

Сейчас хранит весь payload навсегда. Через год это будет огромная таблица.

```prisma
model WebhookEvent {
  ...
  expiresAt   DateTime    // auto-cleanup через pg_cron / app cleanup job
}
```

Либо TimescaleDB hypertable если объём большой.

### 11.9. Индексы которые добавить

```prisma
// Project
@@index([userId, archivedAt, updatedAt])      // listing активных проектов

// Scene
@@index([projectId, status])                  // фильтр по статусу
@@index([branchId, orderIndex])               // для sequence (уже частично)

// Asset
@@index([projectId, type, createdAt])         // photo library listing
@@index([origin, r2Key])                      // cleanup задачи

// GenerationJob
@@index([userId, type, status])               // user-facing activity
@@index([status, createdAt])                  // worker — что обрабатывать
@@index([providerRequestId])                  // уже есть

// CreditLedger
@@index([userId, type, createdAt])            // отчёты
```

### 11.10. Что убрать / упростить

- `Asset.thumbnailAssetId` — пока не используется, удалить
- `Scene.aiPrompt` — если не используется в логике, в metadata
- `BillingSettings` — single-row table, заменить на env / config

### 11.11. Сводная таблица

| Что | Зачем | Сложность миграции |
|---|---|---|
| `User.creditBalance` денормализация | O(1) баланс | Низкая — backfill + триггер |
| `Asset.origin/r2Key/externalUrl` разделение | Уберёт `startsWith("http")` проверки везде | Средняя — миграция данных |
| `SceneBranch` как сущность | AI Creator sequence first-class | Средняя |
| `Scene.*Asset` явные relations | Refer integrity | Низкая |
| `Project.sceneCount` денормализация | Быстрый listing | Низкая |
| `OutboxEvent` | Event-driven | Низкая — новая таблица |
| Структурированный `JobResult` | Чистый аналитический slice | Средняя |
| `AiModel` → только stats | Убрать дуализм code/db | Высокая — много callsites |

### 11.12. Главный tradeoff

Денормализация требует **дисциплины в use-cases**: каждый write должен обновлять и основной row, и счётчики, и outbox в одной транзакции. Если забыть — рассинхрон.
Решение: пропустить через repository pattern, где `SceneRepository.create()` сам обновляет `Project.sceneCount` и пишет `OutboxEvent`. Один сервис — все инварианты.
