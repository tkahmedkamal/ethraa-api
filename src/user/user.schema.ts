import { randomBytes, createHash } from 'crypto';
import { Schema, Types, Document } from 'mongoose';
import isEmail from 'validator/lib/isEmail';
import { hash, verify } from 'argon2';

export const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'errors.user.name.required'],
      minlength: [3, 'errors.user.name.minLength'],
      maxlength: [50, 'errors.user.name.maxLength'],
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'errors.user.username.required'],
      minlength: [3, 'errors.user.username.minLength'],
      maxlength: [20, 'errors.user.username.maxLength'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'errors.user.email.required'],
      unique: true,
      lowercase: true,
      validation: [isEmail, 'errors.user.email.isEmail'],
    },
    password: {
      type: String,
      required: [true, 'errors.user.password.required'],
      minlength: [8, 'errors.user.password.minLength'],
      select: false,
    },
    confirmPassword: {
      type: String,
      required: [true, 'errors.user.password.confirm'],
      validate: {
        validator(value: string) {
          return value === this.password;
        },
        message: 'errors.user.password.match',
      },
    },
    avatar: {
      type: String,
      default: 'avatar-placeholder',
    },
    bio: String,
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: 'errors.user.role',
      },
      default: 'user',
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isActiveAccount: {
      type: Boolean,
      default: false,
    },
    isInfluential: Boolean,
    isAccountVerified: Boolean,
    passwordChangeAt: Date,
    passwordResetToken: String,
    accountVerificationToken: String,
    passwordResetTokenExpiration: Date,
    accountVerificationTokenExpiration: Date,
    facebook: String,
    twitter: String,
    followers: {
      type: [
        {
          type: Types.ObjectId,
          ref: 'User',
        },
      ],
    },
    following: {
      type: [
        {
          type: Types.ObjectId,
          ref: 'User',
        },
      ],
    },
  },
  { timestamps: true },
);

userSchema.index({ name: 1 });
userSchema.index({ email: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await hash(this.password);
  this.confirmPassword = undefined;
});

userSchema.methods.isPasswordEqualHash = async function (
  hashPassword: string,
  plainPassword: string,
) {
  return await verify(hashPassword, plainPassword);
};

userSchema.methods.isUserInFollowers = function (
  userId: Types.ObjectId,
): boolean {
  return this.followers.some(
    (follower: Types.ObjectId) => follower.toString() === userId.toString(),
  );
};

userSchema.methods.checkOldPassword = async function (
  oldPassword: string,
  password: string,
): Promise<boolean> {
  return await verify(password, oldPassword);
};

function generateTokenAndProperties(
  document: Document,
  propertyName: string,
  expirationPropertyName: string,
): string {
  const token = randomBytes(32).toString('hex');
  document[propertyName] = createHash('sha256').update(token).digest('hex');
  document[expirationPropertyName] = Date.now() + 10 * 60 * 1000;

  return token;
}

userSchema.methods.generateResetPasswordToken = function (): string {
  return generateTokenAndProperties(
    this,
    'passwordResetToken',
    'passwordResetTokenExpiration',
  );
};

userSchema.methods.generateAccountVerificationToken = function (): string {
  return generateTokenAndProperties(
    this,
    'accountVerificationToken',
    'accountVerificationTokenExpiration',
  );
};
