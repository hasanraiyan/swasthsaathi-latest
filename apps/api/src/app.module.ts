import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // SKIP_DB lets `generate:openapi` build the Swagger doc without a live Mongo connection.
    ...(process.env.SKIP_DB === 'true' ? [] : [DatabaseModule]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
