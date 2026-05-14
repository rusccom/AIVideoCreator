# Architecture — AI Video Creator

Дата проверки: 2026-05-14

Документ описывает текущую архитектуру проекта, а не желаемую абстрактную схему.

## 1. Главный принцип

Проект строится как feature-based модульный монолит.

Каждая бизнес-фича живёт в `src/features/<feature>`, а внешние входы работают через тонкий слой `src/application/<feature>`.

Запрещённая зависимость:

```txt
src/app -> src/features
worker -> src/features
features/* -> features/*
```

Разрешённая зависимость:

```txt
src/app -> src/application -> src/features -> src/shared
worker -> src/application -> src/features -> src/shared
```

## 2. Текущая структура

```txt
src/
  app/              Next.js layouts, pages, route handlers
  application/      public facades for UI, API routes, server code, workers
  features/         isolated feature modules
  shared/           shared client/server utilities
  styles/           route-level and feature-level CSS

worker/             background processors for generation/export/frame jobs
prisma/             multi-file Prisma schema and migrations
```

## 3. Application layer

`src/application` — единственная публичная точка доступа к фичам для `src/app` и `worker`.

Типы фасадов:

```txt
client.ts          client components/hooks/actions safe for UI imports
server.ts          server services, schemas, queries, route-handler use-cases
worker.ts          background-job API for worker processes
```

Пример:

```txt
src/app/api/... -> src/application/generation/server
worker/...      -> src/application/generation/worker
```

## 4. Features layer

`src/features` содержит фактическую реализацию.

Текущие фичи:

```txt
admin
ai-creator
assets
auth
billing
editor
exports
generation
image-generation
marketing
owner
owner-users
photo-library
projects
realtime
reasoning
settings
studio
timeline
```

Внутри фичи допустимы локальные `components`, `hooks`, `server`, `schemas`, `data`.

Фича не импортирует другую фичу напрямую. Общая логика выносится в `src/shared` или вызывается через `src/application`.

## 5. Shared layer

`src/shared` хранит только общую инфраструктуру и низкоуровневые утилиты:

```txt
src/shared/client/project-events.ts
src/shared/client/project-image-client.ts
src/shared/client/use-resolved-asset-url.ts

src/shared/generation/models/*
src/shared/generation/types.ts

src/shared/model-form/*

src/shared/server/api.ts
src/shared/server/asset-read-url.ts
src/shared/server/asset-storage-service.ts
src/shared/server/counters.ts
src/shared/server/fal-client.ts
src/shared/server/model-stats.ts
src/shared/server/outbox.ts
src/shared/server/outbox-publisher.ts
src/shared/server/prisma.ts
src/shared/server/project-touch.ts
src/shared/server/provider-error.ts
src/shared/server/provider-log.ts
src/shared/server/r2-storage.ts
src/shared/server/realtime-bus.ts
src/shared/server/reasoning-types.ts
src/shared/server/storage-key.ts
```

`shared` не должен зависеть от `features` или `application`.

## 6. Worker layer

`worker` отвечает за долгие задачи:

```txt
process-generation.ts
process-video-generation.ts
process-image-generation.ts
process-frame-extract.ts
process-export.ts
```

Worker не импортирует `src/features` напрямую. Все операции идут через `src/application/*/worker` или `src/application/*/server`.

## 7. Database

Prisma schema разнесена на несколько файлов в `prisma/`.

```txt
schema.prisma       generator + datasource
enums.prisma
users.prisma
projects.prisma
assets.prisma
generation.prisma
billing.prisma
exports.prisma
events.prisma
model-stats.prisma
migrations/
```

`prisma.config.ts` указывает Prisma CLI на директорию `prisma` и сохраняет существующую папку migrations.

## 8. Realtime and events

События проекта пишутся через transactional outbox:

```txt
write transaction -> OutboxEvent -> publisher -> realtime bus -> client refresh
```

Это оставляет write-path атомарным и убирает прямую связь бизнес-операций с транспортом realtime.

## 9. Правила размера

Для кода проекта действует правило `5-300-20-3`:

```txt
function params <= 5
file length     <= 300 lines
function body   <= 20 lines
nesting depth   <= 3
```

Один класс или компонент должен жить в одном файле.

## 10. Текущее соответствие

На 2026-05-14 структура приведена к текущим правилам:

```txt
src/app не импортирует src/features напрямую
worker не импортирует src/features напрямую
features не импортируют features напрямую через alias
features не импортируют src/application напрямую
Prisma schema разделена на файлы меньше 300 строк
CSS разделён на тематические файлы меньше 300 строк
общие model catalog, model form UI, asset/R2, provider, counters/outbox helpers вынесены в src/shared
```

Если появляется новая фича, сначала создаётся `src/features/<feature>`, затем её публичный фасад в `src/application/<feature>`.
