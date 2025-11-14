import { AppConfig } from './types/app.type';
import { DatabaseConfig } from './types/database.type';
import { JwtConfig } from './types/jwt.type';
export class AllConfigType {
  app: AppConfig;
  jwt: JwtConfig;
  database: DatabaseConfig;
}
