import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const OPENAPI_PATH = 'api/docs';

export function configureSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Velora API')
    .setDescription('REST API contracts for the Velora workspace platform.')
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(OPENAPI_PATH, app, documentFactory, {
    customSiteTitle: 'Velora API Documentation',
    jsonDocumentUrl: `${OPENAPI_PATH}-json`,
    yamlDocumentUrl: `${OPENAPI_PATH}-yaml`,
  });
}
