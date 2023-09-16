import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { postSchema } from '../post/post.schema';
import { StatsService } from './stats.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Post', schema: postSchema }])],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
