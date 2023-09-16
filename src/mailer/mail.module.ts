import { join } from 'path';
import { Module } from '@nestjs/common';
import { MailerModule, MailerOptions } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): MailerOptions => {
        return {
          transport:
            config.get<string>('NODE_ENV') === 'development'
              ? {
                  host: 'sandbox.smtp.mailtrap.io',
                  port: config.get<number>('PORT_MAIL'),
                  auth: {
                    user: config.get<string>('USER_NAME_MAIL'),
                    pass: config.get<string>('PASSWORD_MAIL'),
                  },
                }
              : {
                  service: 'gmail',
                  secure: true,
                  auth: {
                    user: config.get<string>('GMAIL_USER'),
                    pass: config.get<string>('GMAIL_PASSWORD'),
                  },
                },
          defaults: {
            from: '<info@ehraa.com>',
          },
          template: {
            dir: join(process.cwd(), 'templates'),
            adapter: new HandlebarsAdapter(),
          },
        };
      },
    }),
    ConfigModule,
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
