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

  @Get('top-fifty-posts')
  findTopFiftyPosts() {
    return this.statsService.findTopFiftyPosts();
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

  @Patch()
  update(@User() user: CreateUserDto, @Body() body: UpdatePostDto) {
    return this.postService.update(user, body);
  }

  @Delete()
  delete(@Body('postId') postId: ObjectId) {
    return this.postService.delete(postId);
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
  @Patch('like')
  like(@User() user: CreateUserDto, @Body() body: UpdatePostDto) {
    return this.postService.like(user.id, body);
  }

  @Auth(Role.USER)
  @Patch('dislike')
  dislike(@User() user: CreateUserDto, @Body() body: UpdatePostDto) {
    return this.postService.dislike(user.id, body);
  }

  @Auth(Role.ADMIN)
  @Delete('delete-all')
  deleteAll() {
    return this.postService.deleteAll();
  }
}
