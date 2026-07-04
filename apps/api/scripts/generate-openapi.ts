import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { createOpenApiDocument } from '../src/config/swagger';
import { configureApplication } from '../src/setup-app';

async function generate(): Promise<void> {
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
