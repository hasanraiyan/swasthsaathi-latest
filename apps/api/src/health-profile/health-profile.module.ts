import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthProfileController } from './health-profile.controller.js';
import { HealthProfileService } from './health-profile.service.js';
import { HealthProfile, HealthProfileSchema } from './schemas/health-profile.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HealthProfile.name, schema: HealthProfileSchema }]),
  ],
  controllers: [HealthProfileController],
  providers: [HealthProfileService],
  exports: [HealthProfileService],
})
export class HealthProfileModule {}
