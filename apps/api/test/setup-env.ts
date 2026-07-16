process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??=
  'postgresql://velora:velora@localhost:5432/velora_test?schema=public';
process.env.JWT_ACCESS_SECRET ??= 'test-secret-with-at-least-32-characters';
process.env.JWT_ACCESS_TTL ??= '15m';
process.env.REFRESH_TOKEN_TTL_DAYS ??= '30';
process.env.API_RATE_LIMIT_MAX = '600';
process.env.API_RATE_LIMIT_WINDOW_MS = '60000';
