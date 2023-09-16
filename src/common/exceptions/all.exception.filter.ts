import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly i18n: I18nService,
  ) {}

  async catch(exception: any, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    let errors: string | string[];

    if (exception && exception?.response?.message?.includes('E11000')) {
      errors = this.handleDuplicateFieldsDB(exception);
    } else {
      if (exception) {
        const isValidationError = exception?.name?.includes('ValidationError');
        const isCastError = exception?.name?.includes('CastError');
        const rateTime = exception?.name?.includes('ThrottlerException');

        const messages = isValidationError
          ? exception?.message
          : exception?.response?.message || 'errors.global.wrong';

        if (Array.isArray(messages)) {
          errors = this.handleValidationErrors(messages);
        } else if (isCastError) {
          const { path, value } = exception;
          errors = this.handleCastErrorDB(path, value);
        } else if (
          messages?.includes('validation failed') ||
          isValidationError
        ) {
          errors = this.handleMongooseErrors(exception.message);
        } else if (rateTime) {
          errors = this.handleRateLimitingError();
        } else {
          errors = this.i18n.t(messages, { lang: I18nContext.current().lang });
        }
      }
    }

    const httpStatusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const httpErrors =
      exception instanceof HttpException
        ? errors
        : exception?.name?.includes('ValidationError') ||
          exception?.name?.includes('CastError')
        ? errors
        : this.i18n.t('errors.global.wrong', {
            lang: I18nContext.current().lang,
          });

    const responseBody = {
      status: `${httpStatusCode}`.startsWith('4') ? 'Fail' : 'Error',
      statusCode: httpStatusCode,
      errors: httpErrors,
      path: httpAdapter.getRequestUrl(ctx.getRequest<Request>()),
    };

    httpAdapter.reply(
      ctx.getResponse<Response>(),
      responseBody,
      httpStatusCode,
    );
  }

  handleDuplicateFieldsDB(exception: any) {
    const value = exception.response.message.split(':')[4].replace('}', '');
    const error = this.i18n.t('errors.global.duplicate', {
      lang: I18nContext.current().lang,
    });

    return error.replace('${}', value);
  }

  handleValidationErrors(messages: string[]) {
    return messages.map(
      message =>
        this.i18n.t(message, {
          lang: I18nContext.current().lang,
        }) as any,
    );
  }

  handleCastErrorDB(path: string, value: string): string {
    const errorText = this.i18n.t('errors.global.cast_error', {
      lang: I18nContext.current().lang,
    });
    return `${errorText}: ( ${path}: ${value} )`;
  }

  handleMongooseErrors(message: string) {
    const errorText = message
      ?.substring(message.indexOf('validation failed'))
      .replace('validation failed: ', '');
    const errorArray = errorText?.split(', ');

    return errorArray.map(item => {
      const [, value] = item?.split?.(': ');
      return this.i18n.t(value, {
        lang: I18nContext.current().lang,
      }) as any;
    });
  }

  handleRateLimitingError() {
    return this.i18n.t('errors.global.rate_limit', {
      lang: I18nContext.current().lang,
    });
  }
}
