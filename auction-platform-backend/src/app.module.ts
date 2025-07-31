import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuctionsModule } from './auctions/auctions.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import databaseConfig from './config/database.config';

@Module({  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        try {
          return {
            ...dbConfig,
            retryAttempts: 5,
            retryDelay: 3000,
            autoLoadEntities: true,
            synchronize: true, // Be careful with this in production
            logging: process.env.NODE_ENV !== 'production',
            extra: {
              connectionTimeoutMillis: 5000,
            }
          };
        } catch (error) {
          console.error('Database configuration error:', error);
          throw error;
        }
      },
      inject: [ConfigService],
    }),
    UsersModule,
    AuctionsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
