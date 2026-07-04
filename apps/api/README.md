# Velora API

NestJS backend for Velora. The API lives in the root npm workspace and uses
PostgreSQL with Prisma ORM.

## Local setup

From the repository root:

```bash
npm install
docker compose up -d postgres
```

Create `apps/api/.env` from `apps/api/.env.example`, then prepare the database:

```bash
npm run db:migrate
npm run db:seed
```

Start the API in watch mode:

```bash
npm run dev:api
```

The versioned health endpoint is available at
`http://localhost:3000/api/v1/health`.

Interactive OpenAPI documentation is available at
`http://localhost:3000/api/docs`. The raw contract is exposed as JSON at
`http://localhost:3000/api/docs-json` and YAML at
`http://localhost:3000/api/docs-yaml`.

## API standards

- Versioned REST routes use the `/api/v1` prefix.
- DTOs reject unknown properties and transform validated query values.
- Pagination uses `page` and `limit` with a maximum page size of 100.
- Sort expressions use `field:asc` or `field:desc`.
- IDs use UUIDs and timestamps use ISO 8601 strings.
- Errors use a stable `{ statusCode, code, message, details?, timestamp, path }`
  response.

## Domain contracts

- Work item hierarchy is `Epic → Task/Bug → Subtask` with a maximum depth of
  two parent edges.
- Parents must belong to the same project; self-parenting and cycles are
  rejected.
- Project roles are `owner`, `admin`, `member`, and `viewer` with centralized
  permission policies.
- Task and column moves use rank anchors plus `expectedUpdatedAt` for
  transactional optimistic-concurrency checks.
- API enums use lowercase values while Prisma keeps uppercase database enums.

## Commands

```bash
npm run build:api
npm run lint:api
npm run test:api
npm run test:api:e2e
npm run test:api:integration
npm run contract:api
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

Database migrations are committed under `prisma/migrations`. Generated Prisma
Client files are intentionally ignored and recreated during builds.

Integration tests automatically create and migrate `velora_test`. A custom
`DATABASE_URL_TEST` is accepted only when its database name ends in `_test`.
`contract:api` writes an ignored `apps/api/openapi.json` snapshot for client
generation and contract compatibility checks.
