import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IPost } from '../post/interfaces';
import { IQueryString } from '../common/interfaces';
import { statsPagination } from '../common/helper';

@Injectable()
export class StatsService {
  constructor(@InjectModel('Post') private readonly postModel: Model<IPost>) {}

  async findUsersWithTheMostLikedPosts() {
    const users = await this.postModel.aggregate([
      {
        $group: {
          _id: '$user',
          totalLikes: { $sum: { $size: '$likes' } },
        },
      },
      {
        $sort: { totalLikes: -1 },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $project: {
          _id: 1,
          totalLikes: 1,
          user: { $arrayElemAt: ['$user', 0] },
        },
      },
      {
        $match: {
          totalLikes: { $gt: 0 },
          'user.isActive': true,
        },
      },
      {
        $project: {
          user: {
            _id: 1,
            name: 1,
            username: 1,
            email: 1,
            avatar: 1,
            followers: 1,
            following: 1,
          },
        },
      },
    ]);

    return {
      status: 'success',
      data: users,
    };
  }

  async findTopTenPosts(queryString: IQueryString) {
    const { page, limit } = queryString;

    const currentPage = +page || 1;
    const pageSize = +limit || 3;
    const skip = (currentPage - 1) * pageSize;

    const posts = await this.postModel.aggregate([
      {
        $addFields: {
          likesCount: { $size: '$likes' },
        },
      },
      {
        $match: {
          likesCount: { $gt: 0 },
          isPublic: true,
          isUserActive: true,
        },
      },
      {
        $sort: { likesCount: -1 },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'likes',
          foreignField: '_id',
          as: 'likes',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'dislikes',
          foreignField: '_id',
          as: 'dislikes',
        },
      },
      {
        $project: {
          user: {
            _id: 1,
            name: 1,
            username: 1,
            email: 1,
            avatar: 1,
          },
          likes: {
            name: 1,
            _id: 1,
          },
          dislikes: {
            name: 1,
            _id: 1,
          },
          quote: 1,
          quoteFor: 1,
          isPublic: 1,
          createdAt: 1,
          updatedAt: 1,
          likesCount: 1,
        },
      },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: pageSize }],
          totalRecords: [
            {
              $count: 'total',
            },
          ],
        },
      },
    ]);

    const totalRecords = posts[0].totalRecords[0].total;
    const pagination = statsPagination({
      total: totalRecords,
      page: currentPage,
      limit: pageSize,
    });

    return {
      status: 'success',
      total_records: totalRecords,
      pagination,
      data: posts[0].data,
    };
  }
}
