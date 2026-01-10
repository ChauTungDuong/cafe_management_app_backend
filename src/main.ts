// Polyfill crypto for Node 18 compatibility
import * as crypto from 'crypto';
if (!globalThis.crypto) {
  (globalThis as any).crypto = crypto.webcrypto;
}

// Force Node.js process to use UTC timezone for all Date operations
// This ensures TypeORM @CreateDateColumn() generates UTC timestamps
process.env.TZ = 'UTC';

import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable cookie parser để đọc cookies từ request
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const allowedOrigins = new Set([
    'http://localhost:3000',
    'http://localhost:1420',
    'http://tauri.localhost',
    'https://tauri.localhost',
    'tauri://localhost',
    'null',
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser tools (no Origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global interceptors
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)), // Loại bỏ thuộc tính @Exclude
  );

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
