import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
const PORT = process.env.PORT || 3434;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
export const CLIENT_DOMAIN = process.env.CLIENT_DOMAIN;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({
    origin: [CLIENT_URL],
    credentials: true,
    exposedHeaders: 'set-cookie',
  });
  await app.listen(PORT).then(() => console.log(`${PORT} ${CLIENT_DOMAIN}`));
}
bootstrap();
