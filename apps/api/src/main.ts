import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { clerkMiddleware } from '@clerk/express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  app.enableCors({
    origin: process.env.WEB_APP_URL ?? 'http://localhost:3002',
    credentials: true,
  });
  app.use(clerkMiddleware());

  const config = new DocumentBuilder()
    .setTitle('SwasthSaathi API')
    .setDescription('SwasthSaathi API — spec used to generate the SDK')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
