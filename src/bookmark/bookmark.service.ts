import { Model } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ObjectId } from 'bson';
import { Filter } from '../common/helper';
import { IQueryString } from '../common/interfaces';
import { IPost } from '../post/interfaces';
import { CreateBookmarkDto } from './dto';
import { IBookmark } from './interface';

@Injectable()
export class BookmarkService {
  constructor(
    @InjectModel('Bookmark') private bookmarkModel: Model<IBookmark>,
    @InjectModel('Post') private postModel: Model<IPost>,
    private i18n: I18nService,
  ) {}

  async findAll(queryString: IQueryString, findBy = {}) {
    const totalRecords = await this.bookmarkModel.countDocuments(findBy);
    const filter = new Filter(this.bookmarkModel.find(findBy), queryString)
      .filter()
      .pagination(totalRecords);

    const bookmarks = await filter.getQuery.populate([
      {
        path: 'post',
        select: 'quote quoteFor createdAt',
      },
      {
        path: 'user',
        select: 'name username',
      },
    ]);

    return {
      status: 'success',
      total_records: totalRecords,
      pagination: filter.getPagination,
      data: bookmarks,
    };
  }

  async findAllForUser(userId: ObjectId, queryString: IQueryString) {
    const total_records = await this.bookmarkModel.countDocuments({
      user: userId,
    });

    const filter = new Filter(
      this.bookmarkModel.find({ user: userId }),
      queryString,
    )
      .filter()
      .pagination(total_records);

    const bookmarks = await filter.getQuery.populate([
      {
        path: 'post',
        match: {
          isUserActive: true,
          isPublic: true,
        },
        select: 'quote quoteFor createdAt',
      },
      {
        path: 'user',
        select: 'name username',
      },
    ]);

    const bookmarkFiltered = bookmarks.filter(
      (bookmark: IBookmark) => bookmark.post !== null,
    );

    return {
      status: 'success',
      total_records,
      pagination: filter.getPagination,
      data: bookmarkFiltered,
    };
  }

  async create(userId: ObjectId, body: CreateBookmarkDto) {
    const { post: postId } = body;
    const result = {
      statusbar: 'success',
    };

    const post = await this.postModel.findOne({
      _id: postId,
      isPublic: true,
      isUserActive: true,
    });

    if (!post) {
      throw new NotFoundException('errors.post.not_found');
    }

    const checkUserPostIsExist = await this.bookmarkModel.findOne({
      post: postId,
      user: userId,
    });

    if (checkUserPostIsExist) {
      await this.bookmarkModel.findByIdAndDelete(checkUserPostIsExist.id);

      return {
        ...result,
        message: this.i18n.t('messages.bookmark.delete_success', {
          lang: I18nContext.current().lang,
        }),
      };
    } else {
      await this.bookmarkModel.create({
        user: userId,
        post: postId,
      });

      return {
        ...result,
        message: this.i18n.t('messages.bookmark.create_success', {
          lang: I18nContext.current().lang,
        }),
      };
    }
  }

  async delete(bookmarkId: ObjectId) {
    const bookmark = await this.bookmarkModel.findByIdAndDelete(bookmarkId);

    if (!bookmark) {
      throw new NotFoundException('errors.bookmark.not_found');
    }

    return {
      status: 'success',
      message: this.i18n.t('messages.bookmark.delete_success', {
        lang: I18nContext.current().lang,
      }),
    };
  }

  async deleteAll() {
    await this.bookmarkModel.deleteMany();

    return {
      status: 'success',
      message: this.i18n.t('messages.bookmark.delete_all', {
        lang: I18nContext.current().lang,
      }),
    };
  }
}
