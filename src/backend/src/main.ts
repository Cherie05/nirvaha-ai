import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const hasKey = !!(process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY);
  if (!hasKey) {
    if (process.env.NODE_ENV === 'production') {
      logger.error(
        'FATAL: GEMINI_API_KEY / GEMINI_API_KEYS is missing. Exiting.',
      );
      process.exit(1);
    } else {
      logger.warn(
        '⚠️  GEMINI_API_KEY / GEMINI_API_KEYS is not set. POST /api/scan will return 503.',
      );
      logger.warn(
        '⚠️  Set GEMINI_API_KEY in src/backend/.env to enable AI scanning.',
      );
    }
  }

  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
