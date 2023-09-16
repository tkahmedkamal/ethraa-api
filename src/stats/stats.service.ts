import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IPost } from '../post/interfaces';

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

  async findTopFiftyPosts() {
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
        $limit: 50,
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
        $project: {
          user: {
            name: 1,
            username: 1,
            email: 1,
            avatar: 1,
          },
          quote: 1,
          quoteFor: 1,
          isPublic: 1,
          likes: 1,
          dislikes: 1,
          createdAt: 1,
          updatedAt: 1,
          likesCount: 1,
        },
      },
    ]);

    return {
      status: 'success',
      data: posts,
    };
  }
}
