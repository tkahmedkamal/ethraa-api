import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'bson';
import { Filter } from '../common/helper';
import { IQueryString } from '../common/interfaces';
import { CreateUserDto } from '../user/dto';
import { Role } from '../common/enums';
import { IUser } from '../user/interfaces';
import { IPost, IPostPopulate } from './interfaces';
import { CreatePostDto, UpdatePostDto } from './dto';

@Injectable()
export class PostService {
  constructor(
    @InjectModel('Post') private postModel: Model<IPost>,
    @InjectModel('User') private userModel: Model<IUser>,
    private readonly i18n: I18nService,
  ) {}

  async findAll(
    queryString: IQueryString,
    isFindAll: boolean = true,
    otherFilters = {},
  ) {
    const total_records = isFindAll
      ? await this.postModel.countDocuments({ ...otherFilters })
      : await this.postModel.countDocuments({
          isPublic: true,
          isUserActive: true,
          ...otherFilters,
        });
    const publicFilter = !isFindAll
      ? { isPublic: true, isUserActive: true }
      : {};

    const filter = new Filter(
      this.postModel.find({ ...publicFilter, ...otherFilters }),
      queryString,
    )
      .filter()
      .sort()
      .search('post')
      .pagination(total_records);

    const posts = await filter.getQuery;

    return {
      status: 'success',
      total_records,
      pagination: filter.getPagination,
      data: posts,
    };
  }

  async findAllForUsers(queryString: IQueryString) {
    const userIds = await this.userModel
      .find({ isActive: true, role: 'user' })
      .select('_id')
      .lean();

    if (!userIds.length) {
      return {
        status: 'success',
        message: this.i18n.t('messages.post.not_found', {
          lang: I18nContext.current().lang,
        }),
      };
    }

    return this.findAll(queryString, false, { user: { $in: userIds } });
  }

  async findAllFollowingPosts(user: CreateUserDto, queryString: IQueryString) {
    const { following } = user;
    return this.findAll(queryString, false, { user: { $in: following } });
  }

  async create(user: CreateUserDto, body: CreatePostDto) {
    const { id: userId, isActiveAccount } = user;
    const { quote, quoteFor, isPublic } = body;

    if (!isActiveAccount) {
      throw new BadRequestException('errors.post.not_account_active');
    }

    const quoteForValue =
      quoteFor?.length === 0 || !quoteFor
        ? this.i18n.t('messages.post.unknown', {
            lang: I18nContext.current().lang,
          })
        : quoteFor;

    const post = await this.postModel.create({
      quote,
      quoteFor: quoteForValue,
      user: userId,
      isPublic,
    });

    await this.userModel.findByIdAndUpdate(userId, {
      $inc: { quoteCount: 1 },
    });

    return {
      status: 'success',
      message: this.i18n.t('messages.post.create_success', {
        lang: I18nContext.current().lang,
      }),
      data: post,
    };
  }

  async deleteAll() {
    await this.postModel.deleteMany();

    return {
      status: 'success',
      message: this.i18n.t('messages.post.delete_all', {
        lang: I18nContext.current().lang,
      }),
    };
  }

  async findOne(postId: string) {
    const post = await this.postModel.findById(postId);

    if (!post) {
      throw new NotFoundException('errors.post.not_found');
    }

    return {
      status: 'success',
      data: post,
    };
  }

  async update(user: CreateUserDto, body: UpdatePostDto, postId: ObjectId) {
    const { quote, quoteFor, isPublic } = body;

    let post: Model<IPostPopulate>;
    const result = {
      status: 'success',
      message: this.i18n.t('messages.post.update_success', {
        lang: I18nContext.current().lang,
      }),
    };

    if (user.role === Role.ADMIN) {
      post = await this.postModel.findByIdAndUpdate(
        { _id: postId },
        {
          quote,
          quoteFor,
          isPublic,
        },
        { new: true, runValidators: true },
      );

      if (!post) {
        throw new NotFoundException('errors.post.not_found');
      }

      return {
        ...result,
        data: post,
      };
    }

    const targetPost = await this.postModel.findById<IPostPopulate>(postId);

    if (!targetPost) {
      throw new NotFoundException('errors.post.not_found');
    }

    if (targetPost && targetPost?.user?._id.toString() !== user.id.toString()) {
      throw new BadRequestException('errors.post.not_belong_to_user');
    }

    post = await this.postModel.findByIdAndUpdate(
      { _id: postId },
      {
        quote,
        quoteFor,
        isPublic,
      },
      { new: true, runValidators: true },
    );

    return {
      ...result,
      data: post,
    };
  }

  async delete(loggedInUser: CreateUserDto, postId: ObjectId) {
    const { id, role } = loggedInUser;
    let post: IPost | any;

    if (role === Role.ADMIN) {
      post = await this.postModel.findByIdAndDelete(postId);
    } else {
      post = await this.postModel.findOneAndDelete({
        _id: postId,
        user: id,
      });
    }

    if (!post) {
      throw new NotFoundException('errors.post.not_found');
    }

    if (post) {
      await this.userModel.findOneAndUpdate(
        { _id: post.user._id, quoteCount: { $gt: 0 } },
        {
          $inc: { quoteCount: -1 },
        },
      );
    }

    return {
      status: 'success',
      message: this.i18n.t('messages.post.delete_success', {
        lang: I18nContext.current().lang,
      }),
    };
  }

  async getAllForUser(
    username: string,
    loggedUser: CreateUserDto,
    queryString: IQueryString,
  ) {
    const user = await this.userModel.findOne({ username });

    if (!user) {
      throw new NotFoundException('errors.user.not_found');
    }

    if (loggedUser.role === Role.ADMIN || loggedUser.id === user.id) {
      return this.findAll(queryString, true, { user: user._id });
    }

    if (user.isActive === false) {
      throw new NotFoundException('errors.user.not_found');
    }

    return this.findAll(queryString, false, { user: user._id });
  }

  async like(userId: ObjectId, postId: string) {
    return this.reactSystem(userId, postId, 'likes');
  }

  async dislike(userId: ObjectId, postId: string) {
    return this.reactSystem(userId, postId, 'dislikes');
  }

  async reactSystem(userId: ObjectId, postId: string, typeReact: string) {
    const targetPost = await this.postModel.findById(postId);
    let post: Model<IPost>;
    const result = {
      status: 'success',
    };

    if (!targetPost) {
      throw new NotFoundException('errors.post.not_found');
    }

    if (!targetPost.isPublic) {
      throw new BadRequestException('errors.post.unpublished');
    }

    const checkUserExist = targetPost.isUserExistsInLikeDislike(
      typeReact,
      userId,
    );

    if (checkUserExist) {
      post = await this.postModel.findByIdAndUpdate(
        { _id: postId },
        {
          $pull: { [typeReact]: userId },
        },
        { new: true, runValidators: true },
      );

      return {
        ...result,
        data: post,
      };
    }

    post = await this.postModel.findByIdAndUpdate(
      { _id: postId },
      {
        $pull: typeReact === 'likes' ? { dislikes: userId } : { likes: userId },
        $push: { [typeReact]: userId },
      },
      { new: true, runValidators: true },
    );

    return {
      ...result,
      data: post,
    };
  }
}
