import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setLogLevel, LogLevel } from '@google/adk';

async function bootstrap() {
  setLogLevel(LogLevel.WARN);
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

