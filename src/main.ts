// Polyfill crypto for Node 18 compatibility
import * as crypto from 'crypto';
if (!globalThis.crypto) {
  (globalThis as any).crypto = crypto.webcrypto;
}

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
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:1420'],
    credentials: true,
  });

  // Global interceptors
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)), // Loại bỏ thuộc tính @Exclude
  );

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
