import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import helmet from 'helmet';
// import * as hpp from 'hpp';
// import * as mongoSanitize from 'express-mongo-sanitize';

import { AppModule } from './app.module';
import { AllExceptionFilter } from './common/exceptions';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  app.use(helmet());
  // app.use(mongoSanitize());
  // app.use(hpp());

  const httpAdapterHost = app.get(HttpAdapterHost);
  const i18nService =
    app.get<I18nService<Record<string, unknown>>>(I18nService);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new AllExceptionFilter(httpAdapterHost, i18nService));
  const frontendUrl = app.get(ConfigService).get('FRONT_BASE_URL');

  const PORT = app.get(ConfigService).get('PORT') || 4000;
  // app.enableCors({
  //   origin: frontendUrl,
  // });
  app.enableCors();
  await app.listen(PORT);
}
bootstrap();
