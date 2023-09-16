import { ObjectId } from 'bson';

export interface IBookmark {
  user: ObjectId;
  post: ObjectId;
}
