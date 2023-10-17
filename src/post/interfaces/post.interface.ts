import { ObjectId } from 'bson';

interface IPostData {
  quote: string;
  quoteFor?: string;
  isPublic?: boolean;
  isUserActive?: boolean;
  likes?: string[];
  dislikes?: string[];
  isUserExistsInLikeDislike?: (typeReact: string, userId: ObjectId) => boolean;
}
export interface IPost extends IPostData {
  user: string;
}

export interface IPostPopulate extends IPostData {
  user: {
    _id: ObjectId;
    name: string;
    username: string;
    isActive: boolean;
    avatar: string;
  };
}
