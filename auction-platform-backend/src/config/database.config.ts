import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Auction } from '../entities/auction.entity';
import { User } from '../entities/user.entity';
import { Bid } from '../entities/bid.entity';

export default registerAs('database', (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'auction_platform',
  entities: [User, Auction, Bid],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV !== 'production',
  retryAttempts: 5,
  retryDelay: 3000,
  autoLoadEntities: true,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : undefined,
  extra: {
    connectionTimeoutMillis: 5000,
  }
}));
