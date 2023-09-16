import { ObjectId } from 'bson';

export interface IPost {
  quote: string;
  user: string;
  quoteFor?: string;
  isPublic?: boolean;
  isUserActive?: boolean;
  likes?: string[];
  dislikes?: string[];
  isUserExistsInLikeDislike?: (typeReact: string, userId: ObjectId) => boolean;
}
