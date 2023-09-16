import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateLoginDto {
  @IsEmail({}, { message: 'errors.user.email.isEmail' })
  @IsOptional()
  email: string;

  @IsString({ message: 'errors.user.username.isString' })
  @IsOptional()
  username: string;

  @IsString({ message: 'errors.user.password.isString' })
  password: string;
}
