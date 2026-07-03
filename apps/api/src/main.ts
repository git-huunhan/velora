import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApplication } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();
  configureApplication(app);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
