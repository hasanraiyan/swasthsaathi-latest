import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PersonaModule } from '@personaai/adapters/nestjs';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { resolveUserFrom } from './persona/resolve-user.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // SKIP_DB lets `generate:openapi` build the Swagger doc in environments with no
    // real Mongo/Persona credentials configured (a fresh checkout, CI). PersonaModule
    // uses getOrThrow, so it needs the same gate even though forRootAsync itself is
    // confirmed non-blocking (verified: a full boot with real Mongo+Persona creds logs
    // "PersonaModule dependencies initialized" immediately, no hang).
    ...(process.env.SKIP_DB === 'true' ? [] : [DatabaseModule]),
    ...(process.env.SKIP_DB === 'true'
      ? []
      : [
          PersonaModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              baseUrl: config.getOrThrow<string>('PERSONA_BASE_URL'),
              credential: config.getOrThrow<string>('PERSONA_CREDENTIAL'),
              resolveUserFrom,
              routePrefix: '/api/persona',
            }),
          }),
        ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
