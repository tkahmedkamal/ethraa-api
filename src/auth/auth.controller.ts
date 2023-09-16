import {
  Body,
  Controller,
  HttpCode,
  Post,
  HttpStatus,
  Patch,
  Query,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { CreateUserDto, UpdateUserDto } from '../user/dto';
import { Role } from '../common/enums';
import { User } from '../common/decorators';
import { CreateLoginDto } from './dto/createLogin.dto';
import { AuthService } from './auth.service';
import { Auth } from './decorators';

@SkipThrottle()
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() auth: CreateUserDto) {
    return this.authService.signup(auth);
  }

  @SkipThrottle({ default: false })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() auth: CreateLoginDto) {
    return this.authService.login(auth);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  forgotPassword(@Body() body: UpdateUserDto) {
    return this.authService.forgotPassword(body);
  }

  @Patch('reset-password')
  resetPassword(
    @Body() body: UpdateUserDto,
    @Query('token')
    token: string,
  ) {
    return this.authService.resetPassword(body, token);
  }

  @HttpCode(HttpStatus.OK)
  @Auth(Role.USER)
  @Post('verify-account-token')
  verifyAccountToken(@User() user: UpdateUserDto) {
    return this.authService.verifyAccountToken(user);
  }

  @Auth(Role.USER)
  @Patch('activate-account')
  activateAccount(@Query('token') token: string) {
    return this.authService.activateAccount(token);
  }
}
