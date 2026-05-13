# Performance Audit — AI Video Creator

Дата: 2026-05-13
Стек: Next.js 16, React 19, Prisma 6, Postgres, R2 (S3), Fal.ai, Stripe

---

## КРИТИЧНО (P0) — блокеры под нагрузкой

### 1. `connection_limit=1` для Prisma в продакшене

**Файл:** `src/shared/server/prisma.ts:25`

По умолчанию ставится 1 соединение к Postgres. Это значит, что **все запросы к БД сериализуются на уровне пула**. При 50+ одновременных пользователях вы получите блокировки и таймауты.

**Fix:** убрать дефолт или поставить минимум `10–20` (в зависимости от Postgres `max_connections`). Для serverless — использовать pgBouncer/Accelerate.

```ts
url.searchParams.set("connection_limit", process.env.PRISMA_CONNECTION_LIMIT ?? "10");
```

---

### 2. Polling-эндпоинты бьют по Fal API на каждый тик

**Файлы:**
- `src/features/generation/server/job-service.ts:11`
- `src/features/ai-creator/server/ai-creator-sequence-service.ts:15`

`refreshGenerationJobForUser` и `getAiCreatorSequenceStatus` синхронно дёргают Fal API (`getFalStatus`) **для каждой генерирующейся сцены на каждый poll**. У AI Creator sequence это умножается на количество сцен.

Клиент опрашивает:
- каждые 3–5 секунд: `src/features/editor/components/ProjectEditor.tsx:162`, `src/features/ai-creator/components/AiCreatorProgressModal.tsx:46`, `src/features/editor/hooks/use-export-download.ts:16`
- каждые 1.2 сек в цикле image generation: `src/features/image-generation/client/project-image-client.ts:35`

**Пример нагрузки:** 100 пользователей × 4 сцены × 1 запрос / 4 сек = **100 запросов/сек к Fal**, что вас зарейтлимитит и съест бюджет.

**Fix:** webhook (`/api/fal/webhook`) уже есть — polling endpoints должны читать **только из БД**, без `getFalStatus`. Это надо реализовать.

---

### 3. Каждая картинка/видео = отдельный запрос к серверу

**Файл:** `src/features/assets/hooks/use-resolved-asset-url.ts:25`

`useResolvedAssetUrl` делает `fetch` с `cache: "no-store"` для каждого ассета. На странице проекта со scene-rail (10 сцен × 3 кадра + 12 ассетов + фото-панель) получается **40+ запросов** к `/api/assets/[id]/signed-url`, каждый из которых: auth + DB query + S3 presign.

В `src/features/editor/hooks/use-resolved-timeline-video-urls.ts:6` есть кэш на 12 мин — **но только для timeline видео**, для остального кэша нет.

**Fix:**
- (а) включить ту же кэш-логику в `useResolvedAssetUrl`;
- (б) лучше — на сервере сразу возвращать пре-подписанные URL в `getEditorProject` (по 15 мин валидны, всё равно поллится). Это сразу убьёт N+1 на клиенте.

---

### 4. `getCreditBalance` агрегирует **весь** CreditLedger пользователя

**Файл:** `src/features/generation/server/credit-service.ts:4`

`aggregate({ _sum: amount })` сканирует все записи леджера. Вызывается на каждой генерации (preflight + reserve), при каждом заходе в studio layout, dashboard, billing.

У активного пользователя через год это могут быть тысячи строк → растущая latency.

**Fix:** хранить `currentBalance` в таблице `User` или отдельной `UserBalance`, обновлять транзакционно вместе с леджером. Либо материализованное представление с периодическим refresh.

---

## ВЫСОКИЙ (P1) — заметная деградация

### 5. Дублирующиеся запросы на странице проекта

**Файл:** `src/app/(studio)/app/projects/[projectId]/page.tsx:13`

Последовательно (НЕ параллельно) ждёт `getCurrentUser → getTopbarData → getEditorProject`. Layout `src/app/(studio)/layout.tsx:33` уже вызвал `getCurrentUser` и `getTopbarData` — это **повторные запросы** в одном рендере.

**Fix:** обернуть `getCurrentUser` и `getCreditBalance` в `React.cache()` (Next.js нативно поддерживает) — будет дедуп в пределах request. И параллелить через `Promise.all` где можно.

```ts
import { cache } from "react";
export const getCurrentUser = cache(async () => { ... });
```

---

### 6. `listProjects` и `getDashboardData` подтягивают тяжёлые relations

**Файлы:**
- `src/features/projects/server/project-service.ts:9` — `include: { scenes: true }` для каждого проекта (для подсчёта клипов!).
- `src/features/studio/server/dashboard-service.ts:53` — `timelineItems` с nested `scene` тоже только для подсчёта длительности.

**Fix:** заменить `include` на `_count` и/или `groupBy` для агрегации длительностей. Либо денормализовать `totalDurationSeconds`/`sceneCount` в Project (поле `totalDurationSeconds` уже есть в schema, но не используется в листинге).

---

### 7. `<img>` вместо `next/image` везде

**Файлы:**
- `src/features/photo-library/components/PhotoLibraryImage.tsx:17`
- `src/features/editor/components/ResolvedAssetImage.tsx:18`
- `src/features/ai-creator/components/AiCreatorMediaTile.tsx:23`

Без `next/image` нет AVIF/WebP, нет `srcset`/`sizes`, нет lazy-loading. Картинки 1024×1024 загружаются полностью в ячейку 80×80.

**Fix:** либо `next/image` с remotePatterns для R2 (нужно `images.remotePatterns` в `next.config.ts`); либо хотя бы добавить `loading="lazy"` и серверную трансформацию через Cloudflare Images / R2 derivatives.

---

### 8. `compactSceneOrder` / `compactTimelineOrder` — N round-trips на удаление

**Файл:** `src/features/generation/server/scene-service.ts:135`

После удаления сцены делает N последовательных `update` через `Promise.all` (внутри транзакции). 50 сцен → 50 + 50 апдейтов. Под `Serializable` уровнем изоляции в credit-service это будет конкурировать за блокировки.

**Fix:** один SQL с `UPDATE ... FROM (SELECT row_number()...)` или batch через raw query.

---

### 9. CreditLedger использует `Serializable` isolation

**Файл:** `src/features/generation/server/credit-service.ts:37`

`TransactionIsolationLevel.Serializable` — самый тяжёлый уровень для Postgres. На горячих ключах будет много P2034 retry.

**Fix:** перейти на `ReadCommitted` + `SELECT ... FOR UPDATE` на балансе. Либо optimistic locking через `updateMany` с проверкой версии.

---

### 10. ProjectEditor получает весь project как prop — нет мемоизации детей

**Файл:** `src/features/editor/components/ProjectEditor.tsx:35`

На любой `setState` (открытие меню, navigation) перерендериваются все ребёнки (`SceneRail`, `PreviewPlayer`, `PhotoPanel`, `StoryboardTimeline`, dnd-kit). Дочерние компоненты не обёрнуты в `memo`, нет split state.

**Fix:** мемоизировать тяжёлые компоненты (`React.memo` на `SceneRailItem`, `TimelineClipSlot`, `PhotoLibraryCard`); вынести `menu` state в отдельный компонент чтобы не дёргать дерево.

---

## СРЕДНИЙ (P2)

### 11. AI Creator: создание sequence — последовательные транзакции

**Файл:** `src/features/ai-creator/server/ai-creator-video-service.ts:45`

For-loop создания 4 сцен = 4 транзакции `prisma.$transaction` подряд. Возможно сделать одну транзакцию.

---

### 12. `createImageAssets` качает изображения последовательно

**Файл:** `src/features/image-generation/server/project-image-service.ts:108`

N remote downloads + R2 uploads подряд. Запараллелить через `Promise.all` — ускорит обработку webhook от Fal в 2-4 раза.

---

### 13. Polling AI Creator слишком частый при множестве сцен

В `getAiCreatorSequenceStatus` помимо Fal-вызовов ещё **3 запроса к Scene** в одном вызове + Promise.all `refreshSequenceJob` для каждой сцены. Один пользователь с 4-сценной sequence генерирует ~8 DB запросов + 4 внешних API на каждый 4-сек poll.

---

### 14. Marketing-страница не статична

**Файл:** `src/app/(marketing)/page.tsx`

Нет `export const dynamic = "force-static"`. Хотя контент полностью статичный. Sitemap, opengraph image и т.п. тоже могут быть статикой.

**Fix:** добавить `export const revalidate = 3600` или `dynamic = "force-static"`.

---

### 15. `PreviewVideo` requestAnimationFrame без deps cleanup

**Файл:** `src/features/editor/components/PreviewVideo.tsx:137`

RAF цикл реагирует на `playback.seek`, `playback.setCurrentTime` (новые ссылки часто), может приводить к перезапуску цикла. Заметно на длинных таймлайнах.

---

### 16. Tailwind/CSS не оптимизирован

**Файл:** `src/app/(studio)/layout.tsx:3-15`

12 ручных импортов CSS. Все они загружаются на КАЖДОЙ studio-странице, включая dashboard/billing где `editor-*.css` не нужны.

**Fix:** импортировать CSS на уровне нужной страницы/компонента или динамически.

---

### 17. AI Creator polling без exponential backoff

Все pollers фиксированно опрашивают каждые N секунд, даже если ничего не меняется. Если генерация идёт 30+ секунд — это лишний трафик.

**Fix:** начинать с 2с, удваивать до 15с, сбрасывать при изменении статуса.

---

## НИЗКИЙ (P3) — улучшения

- **Нет HTTP cache headers** на `/api/assets/[id]/signed-url` — можно ставить `Cache-Control: private, max-age=600` (URL живёт 15 мин).
- **`fal-client` configured = let** — глобальная мутация, в edge runtime может быть race condition (сейчас `runtime = "nodejs"`, безопасно).
- **`next.config.ts` пустой** — нет настроек `images`, `compress`, `productionBrowserSourceMaps`, `experimental.optimizePackageImports` (`lucide-react` особенно — большой бандл).
- **lucide-react** импортируется именованно во многих файлах — можно сократить бандл через `experimental.optimizePackageImports: ['lucide-react']`.
- **JWT secret** через `jwtVerify` на каждый запрос — это норм, но `new TextEncoder().encode(...)` пересчитывается каждый раз (`src/features/auth/server/session.ts:18`). Можно кешировать.
- **Dashboard `getStorageBytesQuery`** агрегирует все ассеты пользователя — со временем замедлится. Кэшировать или хранить в User.

---

## Резюме топ-5 для немедленного фикса

| # | Что | Где | Ожидаемый эффект |
|---|---|---|---|
| 1 | `connection_limit=1` → `10+` | `src/shared/server/prisma.ts:25` | Снимет блокировку всей БД |
| 2 | Убрать вызовы Fal API из polling endpoints | `src/features/generation/server/job-service.ts`, `src/features/ai-creator/server/ai-creator-sequence-service.ts` | -90% внешних API вызовов |
| 3 | Возвращать pre-signed URL прямо в `getEditorProject` или кэшировать на клиенте | `src/features/assets/hooks/use-resolved-asset-url.ts`, `src/features/editor/server/editor-service.ts` | -40 запросов на открытие проекта |
| 4 | Денормализовать баланс кредитов | `src/features/generation/server/credit-service.ts:4` | O(1) вместо O(N) |
| 5 | `React.cache()` на `getCurrentUser` + `_count` вместо `include: { scenes }` | layouts, dashboard | -2-3 запроса/страница |
