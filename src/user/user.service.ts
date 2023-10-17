import { existsSync, mkdirSync, unlink } from 'fs';
import * as path from 'path';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { SharpService } from 'nestjs-sharp';
import { Model } from 'mongoose';
import { ObjectId } from 'bson';
import { Filter } from '../common/helper';
import { IQueryString } from '../common/interfaces';
import { Role } from '../common/enums';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { IPost } from '../post/interfaces';
import { CreateUserDto, UpdateUserDto } from './dto';
import { IFollow, IUser } from './interfaces';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<IUser>,
    @InjectModel('Post') private readonly postModel: Model<IPost>,
    private sharp: SharpService,
    private cloudinaryService: CloudinaryService,
    private readonly i18n: I18nService,
  ) {}

  async findAll(role: string, queryString: IQueryString, otherFilters = {}) {
    const searchName = queryString?.search
      ? {
          $or: [
            { name: { $regex: queryString.search, $options: 'i' } },
            { bio: { $regex: queryString.search, $options: 'i' } },
          ],
        }
      : {};

    const userRoleFilter =
      role === Role.USER
        ? {
            isActive: true,
            role: Role.USER,
          }
        : {};
    const total_records = await this.userModel.countDocuments({
      ...userRoleFilter,
      ...otherFilters,
      ...searchName,
    });

    const filter = new Filter(
      this.userModel.find({ ...userRoleFilter, ...otherFilters }),
      queryString,
    )
      .filter()
      .sort()
      .search()
      .pagination(total_records);
    const users = await filter.getQuery;

    return {
      status: 'success',
      total_records,
      pagination: filter.getPagination,
      data: users,
    };
  }

  async suggestFollowersOfMyFollowing(
    user: CreateUserDto,
    queryString: IQueryString,
  ) {
    const usersFollowers = await this.userModel
      .find({
        _id: { $in: user.following },
      })
      .select('followers');

    const followers = [];
    usersFollowers.forEach(follower => {
      followers.push(...follower.followers);
    });

    const followersFiltered = followers.filter(follow => {
      const followIdString = follow.toString();
      const userIdString = user.id.toString();

      if (followIdString === userIdString) {
        return false;
      }

      const isFollowed = user.following.some(
        following => following._id.toString() === followIdString,
      );
      return !isFollowed;
    });

    return this.findAll('user', queryString, {
      _id: { $in: followersFiltered },
    });
  }

  async getMe(username: string) {
    return await this.findOne(username);
  }

  async updateMe(username: string, userData: UpdateUserDto, userRole: Role) {
    return await this.update(username, userData, userRole);
  }

  async updateMePassword(userId: ObjectId, body: UpdateUserDto) {
    const { oldPassword, password, confirmPassword } = body;

    const user = await this.userModel.findById(userId).select('+password');
    const checkOldPassword = await user.checkOldPassword(
      oldPassword,
      user.password,
    );

    if (!checkOldPassword) {
      throw new BadRequestException('errors.user.old_password');
    }

    user.password = password;
    user.confirmPassword = confirmPassword;
    await user.save({ validateBeforeSave: true });

    return {
      status: 'success',
      message: this.i18n.t('messages.user.update_password_success', {
        lang: I18nContext.current().lang,
      }),
      data: user,
    };
  }

  async deleteMe(username: string) {
    return await this.delete(username);
  }

  async updateTheme(username: string, body: UpdateUserDto) {
    const { isDarkMode } = body;
    return await this.setting(username, { isDarkMode });
  }

  async updateLanguage(username: string, body: UpdateUserDto) {
    const { language } = body;
    return await this.setting(username, { language });
  }

  async findUserFollowers(username: string, queryString: IQueryString) {
    const user = await this.userModel.findOne({ username });

    if (!user) {
      throw new NotFoundException('errors.user.not_found');
    }

    return this.findAll(Role.USER, queryString, { following: user._id });
  }

  async findUserFollowing(username: string, queryString: IQueryString) {
    const user = await this.userModel.findOne({ username });

    if (!user) {
      throw new NotFoundException('errors.user.not_found');
    }

    return this.findAll(Role.USER, queryString, { followers: user._id });
  }

  async deactivate(loggedUser: UpdateUserDto) {
    const user = await this.userModel.findByIdAndUpdate(
      { _id: loggedUser.id },
      {
        isActive: false,
      },
      { new: true, runValidators: true },
    );

    await this.postModel.updateMany({ user: user.id }, { isUserActive: false });

    return {
      status: 'success',
      message: this.i18n.t('messages.user.deactivate', {
        lang: I18nContext.current().lang,
      }),
      data: user,
    };
  }

  async uploadAvatar(
    loggedUser: UpdateUserDto,
    username: string,
    file: Express.Multer.File,
  ) {
    if (username !== loggedUser.username && loggedUser.role === Role.USER) {
      throw new BadRequestException('errors.user.change_avatar_not_belong');
    }

    const { originalname, buffer, mimetype } = file;

    const uploadPath = `${path.join(__dirname, '..', 'uploads/users')}`;
    const avatarFormat = `${username}-${Date.now()}-${originalname}`;
    const filePath = path.join(uploadPath, avatarFormat);
    const extension = mimetype?.split('/')[1];
    const fileId = `${username}-${originalname?.split(`.${extension}`)[0]}`;

    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }

    await this.sharp
      .edit(buffer)
      .resize(250, 250)
      .toFormat('jpeg')
      .jpeg({ mozjpeg: true })
      .toFile(filePath);

    const avatar = await this.cloudinaryService.uploadFile(
      filePath,
      'ethraa/users',
      fileId,
    );

    unlink(filePath, err => {
      if (err) {
        throw new ForbiddenException('errors.global.systems_error');
      }
    });

    const user = await this.userModel.findOneAndUpdate(
      { username },
      {
        avatar,
      },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('errors.user.not_found');
    }

    return {
      status: 'success',
      data: user,
    };
  }

  async findOneForUsers(username: string) {
    return this.findOne(username, true);
  }

  async follow(user: UpdateUserDto, username: string) {
    const { id: userId, username: loggedInUsername } = user;

    if (username === loggedInUsername) {
      throw new NotFoundException('errors.user.not_follow_me');
    }

    const targetUser = await this.userModel.findOne({
      username,
      isActive: true,
    });

    if (!targetUser) {
      throw new NotFoundException('errors.user.not_found');
    }

    const isUserInFollowers = targetUser.isUserInFollowers(userId);

    if (isUserInFollowers) {
      await Promise.all([
        this.followSystem({
          findUserId: targetUser.id,
          arrayMethod: '$pull',
          type: 'followers',
          actionUserId: userId,
        }),

        this.followSystem({
          findUserId: userId,
          arrayMethod: '$pull',
          type: 'following',
          actionUserId: targetUser.id,
        }),
      ]);

      return;
    }

    await Promise.all([
      this.followSystem({
        findUserId: targetUser.id,
        arrayMethod: '$push',
        type: 'followers',
        actionUserId: userId,
      }),

      this.followSystem({
        findUserId: userId,
        arrayMethod: '$push',
        type: 'following',
        actionUserId: targetUser.id,
      }),
    ]);
  }

  async findOne(username: string, isActive: boolean = false) {
    const findAll = isActive ? { isActive: true, role: Role.USER } : {};

    const user = await this.userModel
      .findOne({ username, ...findAll })
      .populate([
        { path: 'followers', select: 'username name avatar isInfluential' },
        { path: 'following', select: 'username name avatar isInfluential' },
      ]);

    if (!user) {
      throw new NotFoundException('errors.user.not_found');
    }

    return {
      status: 'success',
      data: user,
    };
  }

  async update(username: string, body: UpdateUserDto, userRole = Role.ADMIN) {
    const { name, bio, role, facebook, twitter } = body;

    const user = await this.userModel.findOneAndUpdate(
      { username },
      {
        name,
        bio,
        role: userRole === Role.USER ? Role.USER : role,
        isAdmin: userRole === Role.ADMIN && role === Role.ADMIN,
        facebook,
        twitter,
      },
      { new: true, runValidators: true },
    );

    if (!user) {
      throw new NotFoundException('errors.user.not_found');
    }

    return {
      status: 'success',
      message: this.i18n.t('messages.user.update_success', {
        lang: I18nContext.current().lang,
      }),
      data: user,
    };
  }

  async updatePassword(username: string, userData: UpdateUserDto) {
    const { password, confirmPassword } = userData;

    const user = await this.userModel.findOne({ username });

    if (!user) {
      throw new NotFoundException('errors.user.not_found');
    }

    user.password = password;
    user.confirmPassword = confirmPassword;
    await user.save({ validateBeforeSave: true });

    return {
      status: 'success',
      message: this.i18n.t('messages.user.update_password_success'),
      data: user,
    };
  }

  async delete(username: string) {
    const user = await this.userModel.findOneAndDelete({ username });

    if (!user) {
      throw new NotFoundException('errors.user.not_found');
    }

    return {
      status: 'success',
      message: this.i18n.t('messages.user.delete_success'),
    };
  }

  async deleteAll() {
    await this.userModel.deleteMany();
    return {
      status: 'success',
      message: this.i18n.t('messages.user.delete_all'),
    };
  }

  async followSystem({ findUserId, arrayMethod, type, actionUserId }: IFollow) {
    await this.userModel.findByIdAndUpdate(
      findUserId,
      {
        [arrayMethod]: { [type]: actionUserId },
      },
      { new: true },
    );
  }

  async setting(
    username: string,
    newData: {
      isDarkMode?: boolean;
      language?: string;
    },
  ) {
    const user = await this.userModel.findOneAndUpdate({ username }, newData, {
      new: true,
    });

    if (!user) {
      throw new NotFoundException('errors.user.not_found');
    }
  }
}
