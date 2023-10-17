import { ObjectId } from 'bson';

export interface IUser {
  _id?: string;
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  oldPassword?: string;
  avatar?: string;
  bio?: string;
  role?: string;
  quoteCount?: number;
  isAdmin?: boolean;
  isActive?: boolean;
  isActiveAccount?: boolean;
  isDarkMode?: boolean;
  language?: string;
  facebook?: string;
  twitter?: string;
  followers?: [];
  following?: [];
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
