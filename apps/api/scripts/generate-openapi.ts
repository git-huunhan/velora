import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';

process.env.JWT_ACCESS_SECRET ??=
  'contract-generation-secret-with-at-least-32-characters';
process.env.JWT_ACCESS_TTL ??= '15m';
process.env.REFRESH_TOKEN_TTL_DAYS ??= '30';

async function generate(): Promise<void> {
  const [{ AppModule }, { createOpenApiDocument }, { configureApplication }] =
    await Promise.all([
      import('../src/app.module.js'),
      import('../src/config/swagger.js'),
      import('../src/setup-app.js'),
    ]);
  const app = await NestFactory.create(AppModule, {
    abortOnError: false,
    logger: false,
  });
  configureApplication(app);
  await app.init();

  const outputPath = resolve(process.cwd(), 'openapi.json');
  const document = createOpenApiDocument(app);
  await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  await app.close();
  console.log(`OpenAPI contract written to ${outputPath}`);
}

generate().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
