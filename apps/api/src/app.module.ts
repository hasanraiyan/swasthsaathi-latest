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
import { MedicalReportsModule } from './medical-reports/medical-reports.module.js';
import { MedicationDosesModule } from './medication-doses/medication-doses.module.js';
import { MedicationsModule } from './medications/medications.module.js';
import { resolveUserFrom } from './persona/resolve-user.js';
import { RcpModule } from './rcp/rcp.module.js';
import { buildRcpTools } from './rcp/rcp-tools.js';
import { RemindersModule } from './reminders/reminders.module.js';

function rcpManifestOptions(config: ConfigService) {
  const publicUrl = config.get<string>('RCP_PUBLIC_URL');
  const authToken = config.get<string>('RCP_SECRET');
  if (!publicUrl || !authToken) return {};
  return { rcpManifest: { tools: buildRcpTools(publicUrl), authToken } };
}

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
    MedicalReportsModule,
    RcpModule,
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
              // RCP manifest at GET /api/persona/rcp/manifest — only served
              // once both RCP_PUBLIC_URL (this API server's own public origin,
              // which every tool URL points at) and RCP_SECRET are set.
              ...rcpManifestOptions(config),
            }),
          }),
        ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
