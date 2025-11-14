import { registerAs } from '@nestjs/config';
import { JwtConfig } from './types/jwt.type';

export default registerAs<JwtConfig>('jwt', () => ({
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
}));
