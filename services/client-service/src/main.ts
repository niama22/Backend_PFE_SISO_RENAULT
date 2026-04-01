import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validation automatique des DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Prefix global pour toutes les routes
  app.setGlobalPrefix('api');

  await app.listen(3000);
console.log('Client Service running on port 3000');
}
bootstrap();