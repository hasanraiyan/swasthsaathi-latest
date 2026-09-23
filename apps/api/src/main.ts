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

  // Any origin: auth is a Clerk bearer token in the Authorization header, never
  // cookies, so there's no ambient credential another site could ride on.
  // (credentials stays off — browsers reject `*` with credentials anyway.)
  app.enableCors({ origin: '*' });
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
