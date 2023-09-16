import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { postSchema } from '../post/post.schema';
import { BookmarkController } from './bookmark.controller';
import { BookmarkService } from './bookmark.service';
import { bookmarkSchema } from './bookmark.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: 'Bookmark', schema: bookmarkSchema },
      { name: 'Post', schema: postSchema },
    ]),
    UserModule,
  ],
  controllers: [BookmarkController],
  providers: [BookmarkService],
})
export class BookmarkModule {}
