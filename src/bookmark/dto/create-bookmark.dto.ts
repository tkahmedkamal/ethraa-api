import { ObjectId } from 'bson';
import { IsMongoIdObject } from '../../common/decorators';

export class CreateBookmarkDto {
  @IsMongoIdObject({ message: 'errors.bookmark.user.id' })
  user = new ObjectId();

  @IsMongoIdObject({ message: 'errors.bookmark.post.id' })
  post = new ObjectId();
}
