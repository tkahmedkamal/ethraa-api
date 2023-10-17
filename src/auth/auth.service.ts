import { createHash } from 'crypto';
import { Model } from 'mongoose';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { IUser } from '../user/interfaces';
import { MailService } from '../mailer/mail.service';
import { CreateUserDto, UpdateUserDto } from '../user/dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<IUser>,
    @InjectModel('Post') private readonly postModel: Model<IUser>,
    private mailService: MailService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private i18n: I18nService,
  ) {}

  async signup({
    name,
    username,
    email,
    password,
    confirmPassword,
  }: CreateUserDto) {
    try {
      const user = await this.userModel.create({
        name,
        username,
        email,
        password,
        confirmPassword,
      });

      const token = await this.signToken({
        sub: user.id,
        email: user.email,
        username: user.username,
        isActiveAccount: user.isActiveAccount,
      });
      return {
        status: 'success',
        message: this.i18n.t('messages.user.signup_success', {
          lang: I18nContext.current().lang,
        }),
        data: user,
        access_token: token,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async login({ email, username, password }) {
    try {
      const user = await this.userModel
        .findOne({ $or: [{ email }, { username }] })
        .select('-__v, +password');

      if (
        !user ||
        !(await user?.isPasswordEqualHash(user.password, password))
      ) {
        throw new UnauthorizedException('errors.user.credentials');
      }

      if (!user.isActive) {
        user.isActive = true;
        await user.save({ validateBeforeSave: false });
        await this.postModel.updateMany(
          { user: user.id },
          { isUserActive: true },
        );
      }

      const token = await this.signToken({
        sub: user.id,
        email: user.email,
        username: user.username,
        isActiveAccount: user.isActiveAccount,
      });

      return {
        status: 'success',
        message: this.i18n.t('messages.user.login_success', {
          lang: I18nContext.current().lang,
        }),
        data: user,
        access_token: token,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async forgotPassword(body: UpdateUserDto) {
    const { email, username } = body;

    return this.sendGenerateEmailToken({
      label: 'password',
      findBy: { $or: [{ email }, { username }] },
      generateToken: 'generateResetPasswordToken',
      url: 'auth/reset-password',
    });
  }

  async resetPassword(body: UpdateUserDto, passwordToken: string) {
    const { password, confirmPassword } = body;

    const user = await this.checkInvalidEmailToken(
      passwordToken,
      'passwordResetToken',
      'passwordResetTokenExpiration',
    );

    user.password = password;
    user.confirmPassword = confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiration = undefined;
    await user.save({ validateBeforeSave: true });

    const token = await this.signToken({
      sub: user.id,
      email: user.email,
      username: user.username,
      isActiveAccount: user.isActiveAccount,
    });

    return {
      status: 'success',
      message: this.i18n.t('messages.user.update_password_success', {
        lang: I18nContext.current().lang,
      }),
      data: user,
      access_token: token,
    };
  }

  async verifyAccountToken(loggedInUser: UpdateUserDto) {
    const { id } = loggedInUser;

    return this.sendGenerateEmailToken({
      label: 'account',
      findBy: { _id: id },
      generateToken: 'generateAccountVerificationToken',
      url: 'verify-account',
    });
  }

  async activateAccount(accountToken: string) {
    const user = await this.checkInvalidEmailToken(
      accountToken,
      'accountVerificationToken',
      'accountVerificationTokenExpiration',
    );

    user.isActiveAccount = true;
    user.accountVerificationToken = undefined;
    user.accountVerificationTokenExpiration = undefined;
    await user.save({ validateBeforeSave: false });

    return {
      status: 'success',
      message: this.i18n.t('messages.user.activate_account_success', {
        lang: I18nContext.current().lang,
      }),
      data: user,
    };
  }

  private async sendGenerateEmailToken({ label, findBy, generateToken, url }) {
    const user = await this.userModel.findOne(findBy);

    if (!user) {
      throw new NotFoundException('errors.user.not_found');
    }

    const token = user[generateToken]();

    const mailOptions = {
      to: `${user.name} <${user.email}>`,
      subject: `messages.mail.${label}.subject`,
      title: `messages.mail.${label}.title`,
      content: `messages.mail.${label}.content`,
      buttonText: `messages.mail.${label}.button_text`,
      url: `${this.configService.get<string>(
        'FRONT_BASE_URL',
      )}/${url}/${token}`,
      template: 'index',
    };

    try {
      await user.save({ validateBeforeSave: false });

      await this.mailService.sendMail(mailOptions);

      return {
        status: 'success',
        message: `${this.i18n.t('messages.mail.send_success', {
          lang: I18nContext.current().lang,
        })} ${user.email}`,
      };
    } catch (error) {
      if (label === 'password') {
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpiration = undefined;
      } else {
        user.accountVerificationToken = undefined;
        user.accountVerificationTokenExpiration = undefined;
      }

      await user.save();
      throw new ForbiddenException('errors.mail_error');
    }
  }

  private async checkInvalidEmailToken(
    token: string,
    tokenField: string,
    tokenExpirationField: string,
  ) {
    if (!token) {
      throw new BadRequestException('errors.global.invalid_token');
    }

    const compareToken = createHash('sha256').update(token).digest('hex');

    const user = await this.userModel.findOne({
      [tokenField]: compareToken,
      [tokenExpirationField]: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('errors.global.invalid_token');
    }

    return user;
  }

  private async signToken({ sub, email, username, isActiveAccount }) {
    return await this.jwtService.signAsync({
      sub,
      email,
      username,
      isActiveAccount,
    });
  }
}
