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

## Commands

```bash
npm run build:api
npm run lint:api
npm run test:api
npm run test:api:e2e
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

Database migrations are committed under `prisma/migrations`. Generated Prisma
Client files are intentionally ignored and recreated during builds.
