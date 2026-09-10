import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // Falls back to a placeholder URI so the module graph (and anything
        // that does MongooseModule.forFeature) still resolves during
        // `generate:openapi`, which boots the app with no real Mongo needed.
        uri: config.get<string>('MONGODB_URI') ?? 'mongodb://127.0.0.1:27017/swasthsaathi',
      }),
    }),
  ],
})
export class DatabaseModule {}
