import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ObjectId } from 'bson';
import { Auth } from '../auth/decorators';
import { Role } from '../common/enums';
import { User } from '../common/decorators';
import { CreateUserDto } from '../user/dto';
import { IQueryString } from '../common/interfaces';
import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto } from './dto';
import { StatsService } from '../stats/stats.service';

@SkipThrottle()
@Auth(Role.USER, Role.ADMIN)
@Controller('api/posts')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly statsService: StatsService,
  ) {}

  @Get('top-ten-posts')
  findTopFiftyPosts(@Query() queryString: IQueryString) {
    return this.statsService.findTopTenPosts(queryString);
  }

  @Auth(Role.ADMIN)
  @Get()
  findAll(@Query() queryString: IQueryString) {
    return this.postService.findAll(queryString);
  }

  @Auth(Role.USER)
  @Get('for-users')
  findAllForUsers(@Query() queryString: IQueryString) {
    return this.postService.findAllForUsers(queryString);
  }

  @Auth(Role.USER)
  @Get('following-posts')
  findAllFollowingPosts(
    @User() user: CreateUserDto,
    @Query() queryString: IQueryString,
  ) {
    return this.postService.findAllFollowingPosts(user, queryString);
  }

  @Auth(Role.ADMIN)
  @Get(':id')
  findOne(@Param('id') postId: string) {
    return this.postService.findOne(postId);
  }

  @Auth(Role.USER)
  @Post()
  create(@User() user: CreateUserDto, @Body() body: CreatePostDto) {
    return this.postService.create(user, body);
  }

  @Patch(':postId')
  update(
    @User() user: CreateUserDto,
    @Body() body: UpdatePostDto,
    @Param('postId') postId: ObjectId,
  ) {
    return this.postService.update(user, body, postId);
  }

  @Delete(':postId')
  delete(@User() user: CreateUserDto, @Param('postId') postId: ObjectId) {
    return this.postService.delete(user, postId);
  }

  @Get('for-user/:username')
  getAllForUser(
    @Param('username') username: string,
    @Query() queryString: IQueryString,
    @User() user: CreateUserDto,
  ) {
    return this.postService.getAllForUser(username, user, queryString);
  }

  @Auth(Role.USER)
  @Patch('like/:postId')
  like(@User() user: CreateUserDto, @Param('postId') postId: string) {
    return this.postService.like(user.id, postId);
  }

  @Auth(Role.USER)
  @Patch('dislike/:postId')
  dislike(@User() user: CreateUserDto, @Param('postId') postId: string) {
    return this.postService.dislike(user.id, postId);
  }

  @Auth(Role.ADMIN)
  @Delete('delete-all')
  deleteAll() {
    return this.postService.deleteAll();
  }
}
