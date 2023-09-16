import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private i18n: I18nService,
  ) {}

  async sendMail({ to, subject, title, content, url, buttonText, template }) {
    await this.mailerService.sendMail({
      to,
      subject: this.i18n.t(subject, { lang: I18nContext.current().lang }),
      template,
      context: {
        title: this.i18n.t(title, { lang: I18nContext.current().lang }),
        content: `${this.i18n.t(content, {
          lang: I18nContext.current().lang,
        })}`,
        url,
        buttonText: this.i18n.t(buttonText, {
          lang: I18nContext.current().lang,
        }),
      },
    });
  }
}
