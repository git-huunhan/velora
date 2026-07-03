process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??=
  'postgresql://velora:velora@localhost:5432/velora_test?schema=public';
