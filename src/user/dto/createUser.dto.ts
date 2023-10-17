import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  IsEnum,
  IsBoolean,
  IsArray,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ObjectId } from 'bson';
import { Match } from '../../auth/decorators';
import { IsMongoIdObject } from '../../common/decorators';
import { Role } from '../../common/enums';

export class CreateUserDto {
  @IsMongoIdObject()
  id = new ObjectId();

  @IsString({ message: 'errors.user.name.isString' })
  @MinLength(3, { message: 'errors.user.name.minLength' })
  @MaxLength(50, { message: 'errors.user.name.maxLength' })
  name: string;

  @IsString({ message: 'errors.user.username.isString' })
  @MinLength(3, { message: 'errors.user.username.minLength' })
  @MaxLength(20, { message: 'errors.user.username.maxLength' })
  username: string;

  @IsEmail({}, { message: 'errors.user.email.isEmail' })
  email: string;

  @IsString({ message: 'errors.user.password.isString' })
  @MinLength(8, { message: 'errors.user.password.minLength' })
  password: string;

  @IsOptional()
  oldPassword: string;

  @IsString({ message: 'errors.user.password.confirmIsString' })
  @Match('password', { message: 'errors.user.password.match' })
  confirmPassword: string;

  @IsString()
  @IsOptional()
  avatar: string;

  @IsString()
  @IsOptional()
  bio: string;

  @IsString()
  @IsEnum(Role, { message: 'errors.user.role' })
  @IsOptional()
  role: string;

  @IsNumber({}, { message: 'errors.user.quoteCount' })
  @IsOptional()
  quoteCount: number;

  @IsBoolean({ message: 'errors.user.isAdmin' })
  @IsOptional()
  isAdmin: boolean;

  @IsBoolean({ message: 'errors.user.isActive' })
  @IsOptional()
  isActive: boolean;

  @IsBoolean({ message: 'errors.user.isActiveAccount' })
  @IsOptional()
  isActiveAccount: boolean;

  @IsBoolean({ message: 'errors.user.isDarkMode' })
  @IsOptional()
  isDarkMode: boolean;

  @IsString()
  @IsOptional()
  language: string;

  @IsString()
  @IsOptional()
  facebook: string;

  @IsString()
  @IsOptional()
  twitter: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  followers: [
    { _id: ObjectId; name: string; username: string; avatar: string },
  ];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  following: [
    { _id: ObjectId; name: string; username: string; avatar: string },
  ];
}
