import { ObjectId } from 'bson';

export interface IUser {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  oldPassword?: string;
  avatar?: string;
  bio?: string;
  role?: string;
  isAdmin?: boolean;
  isActive?: boolean;
  isActiveAccount?: boolean;
  isInfluential?: boolean;
  facebook?: string;
  twitter?: string;
  followers?: [string];
  following?: [string];
  passwordResetToken?: string;
  passwordResetTokenExpiration?: Date;
  accountVerificationToken?: string;
  accountVerificationTokenExpiration?: Date;
  isPasswordEqualHash?: (
    hashPassword: string,
    plainPassword: string,
  ) => boolean;
  isUserInFollowers?: (userId: ObjectId) => boolean;
  checkOldPassword?: (oldPassword: string, password: string) => boolean;
  generateResetPasswordToken?: () => string;
  generateAccountVerificationToken?: () => string;
}
