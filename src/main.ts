import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import * as dotenv from 'dotenv';
import { setDefaultResultOrder } from 'node:dns';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  dotenv.config();
  // Prefer IPv4 first to avoid ENETUNREACH on servers without IPv6 egress
  try {
    setDefaultResultOrder('ipv4first');
    // eslint-disable-next-line no-empty
  } catch {}
  const app = await NestFactory.create(AppModule, { cors: true });
  // تفعيل التحقق من DTOs عالمياً ليعمل مع Swagger
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Social Media API')
    .setDescription('API for a social media platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  console.log('DB_URL from env:', process.env.DATABASE_URL);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
