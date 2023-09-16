import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { userSchema } from '../user/user.schema';
import { postSchema } from './post.schema';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { StatsService } from '../stats/stats.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: 'Post', schema: postSchema },
      { name: 'User', schema: userSchema },
    ]),
    UserModule,
  ],
  controllers: [PostController],
  providers: [PostService, StatsService],
})
export class PostModule {}
