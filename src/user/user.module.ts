import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SharpModule } from 'nestjs-sharp';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { postSchema } from '../post/post.schema';
import { UserController } from './user.controller';
import { userSchema } from './user.schema';
import { UserService } from './user.service';
import { StatsService } from '../stats/stats.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: 'User', schema: userSchema },
      { name: 'Post', schema: postSchema },
    ]),
    SharpModule,
    CloudinaryModule,
  ],
  controllers: [UserController],
  providers: [UserService, StatsService],
  exports: [UserService],
})
export class UserModule {}
