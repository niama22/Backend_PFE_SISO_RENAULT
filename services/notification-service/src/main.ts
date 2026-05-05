import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('api');

  const port = parseInt(process.env.NOTIFICATION_PORT ?? '3006', 10);
  await app.listen(port);

  console.log(`Notification Service running on port ${port}`);
}

void bootstrap();
