import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { ObjectId } from 'bson';
import { IsMongoIdObject } from '../../common/decorators';

export class CreatePostDto {
  @IsMongoIdObject({ message: 'errors.post.userId.id' })
  postId = new ObjectId();

  @IsString({ message: 'errors.post.quote.isString' })
  @MinLength(1, { message: 'errors.post.quote.minLength' })
  quote: string;

  @IsMongoIdObject({ message: 'errors.post.userId.id' })
  user = new ObjectId();

  @IsString({ message: 'errors.post.quoteFor.isString' })
  @MinLength(3, { message: 'errors.post.quoteFor.minLength' })
  @IsOptional()
  quoteFor: string;

  @IsBoolean({ message: 'errors.post.isPublic' })
  @IsOptional()
  isPublic: boolean;

  @IsBoolean({ message: 'errors.post.isUserActive' })
  @IsOptional()
  isUserActive: boolean;

  @IsMongoIdObject({ message: 'errors.post.userId.id' })
  @IsOptional()
  likes = new ObjectId();

  @IsMongoIdObject({ message: 'errors.post.userId.id' })
  @IsOptional()
  dislikes = new ObjectId();
}
