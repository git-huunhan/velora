import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { Client } from 'pg';

const defaultUrl =
  'postgresql://velora:velora@localhost:5432/velora_test?schema=public';
const testDatabaseUrl = process.env.DATABASE_URL_TEST ?? defaultUrl;
const parsedUrl = new URL(testDatabaseUrl);
const databaseName = parsedUrl.pathname.slice(1);

if (!databaseName.endsWith('_test') || !/^[a-zA-Z0-9_]+$/.test(databaseName)) {
  throw new Error(
    `Refusing to prepare unsafe test database "${databaseName}". Its name must end with _test.`,
  );
}

async function prepare(): Promise<void> {
  const adminUrl = new URL(testDatabaseUrl);
  adminUrl.pathname = '/postgres';
  adminUrl.search = '';

  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();
  const existing = await client.query<{ exists: boolean }>(
    'SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists',
    [databaseName],
  );
  if (!existing.rows[0]?.exists) {
    await client.query(`CREATE DATABASE "${databaseName}"`);
  }
  await client.end();

  const prismaCli = resolve(
    process.cwd(),
    '../../node_modules/prisma/build/index.js',
  );
  const migration = spawnSync(
    process.execPath,
    [prismaCli, 'migrate', 'deploy'],
    {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: testDatabaseUrl },
      stdio: 'inherit',
    },
  );
  if (migration.status !== 0) {
    throw new Error('Failed to apply migrations to the test database.');
  }
}

prepare().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
