import { Schema, Types } from 'mongoose';

export const bookmarkSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: 'User',
      required: [true, 'errors.bookmark.user.required'],
    },
    post: {
      type: Types.ObjectId,
      ref: 'Post',
      required: [true, 'errors.bookmark.post.required'],
    },
  },
  { timestamps: true },
);
