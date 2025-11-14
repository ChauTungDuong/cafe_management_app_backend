import { registerAs } from '@nestjs/config';
import { DatabaseConfig } from './types/database.type';

export default () => {
  return {
    type: process.env.DATABASE_TYPE as any,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    url: process.env.DATABASE_URL,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    // bỏ khi lên production
    synchronize: process.env.NODE_ENV !== 'production',
  };
};
