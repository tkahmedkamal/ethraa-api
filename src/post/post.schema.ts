import { Query, Schema, Types } from 'mongoose';

export const postSchema = new Schema(
  {
    quote: {
      type: String,
      required: [true, 'errors.post.quote.required'],
      minlength: [1, 'errors.post.quote.minLength'],
    },
    quoteFor: String,
    isPublic: {
      type: Boolean,
      default: true,
    },
    isUserActive: {
      type: Boolean,
      default: true,
    },
    user: {
      type: Types.ObjectId,
      required: [true, 'errors.post.userId.required'],
      ref: 'User',
    },
    likes: {
      type: [
        {
          type: Types.ObjectId,
          ref: 'User',
        },
      ],
    },
    dislikes: {
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

postSchema.pre<Query<any, Document>>(/^find/, function (next) {
  this.populate([
    {
      path: 'user',
      select:
        'name username avatar bio followers following isInfluential isActive',
    },
    { path: 'likes', select: 'name' },
    { path: 'dislikes', select: 'name' },
  ]);
  next();
});

postSchema.methods.isUserExistsInLikeDislike = function (
  typeReact: string,
  userId: Types.ObjectId,
) {
  return this[typeReact].some(
    (like: { id: Types.ObjectId }) => like.id.toString() === userId.toString(),
  );
};
