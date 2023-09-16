import { ObjectId } from 'bson';

export interface IFollow {
  findUserId: ObjectId;
  arrayMethod: string;
  type: string;
  actionUserId: ObjectId;
}
