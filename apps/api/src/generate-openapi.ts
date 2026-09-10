import { writeFileSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('SwasthSaathi API')
    .setDescription('SwasthSaathi API — spec used to generate the SDK')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  writeFileSync('openapi.json', JSON.stringify(document, null, 2));
  await app.close();
}
await generate();
