import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PersonaModule } from '@personaai/adapters/nestjs';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthConditionsModule } from './health-conditions/health-conditions.module.js';
import { HealthEventsModule } from './health-events/health-events.module.js';
import { HealthMeasurementsModule } from './health-measurements/health-measurements.module.js';
import { HealthProfileModule } from './health-profile/health-profile.module.js';
import { MedicationDosesModule } from './medication-doses/medication-doses.module.js';
import { MedicationsModule } from './medications/medications.module.js';
import { resolveUserFrom } from './persona/resolve-user.js';
import { RemindersModule } from './reminders/reminders.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    HealthProfileModule,
    HealthConditionsModule,
    MedicationsModule,
    MedicationDosesModule,
    HealthMeasurementsModule,
    RemindersModule,
    HealthEventsModule,
    // SKIP_DB lets `generate:openapi` build the Swagger doc in environments with no
    // real Persona credentials configured (a fresh checkout, CI). PersonaModule uses
    // getOrThrow for those, so it needs this gate; it isn't part of the typed SDK
    // surface (its routes are mounted by the Persona library itself), so skipping it
    // doesn't affect the generated spec.
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
