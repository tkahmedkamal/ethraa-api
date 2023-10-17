import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SkipThrottle } from '@nestjs/throttler';
import { Auth } from '../auth/decorators';
import { IQueryString } from '../common/interfaces';
import { User } from '../common/decorators';
import { Role } from '../common/enums';
import { avatarMulterOptions } from '../common/helper';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UserService } from './user.service';
import { StatsService } from '../stats/stats.service';

@SkipThrottle()
@Auth(Role.USER, Role.ADMIN)
@Controller('/api/users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly statsService: StatsService,
  ) {}

  @Get('top-liked-posts-users')
  findUsersWithTheMostLikedPosts() {
    return this.statsService.findUsersWithTheMostLikedPosts();
  }

  @Get()
  findAll(@User() user: CreateUserDto, @Query() queryString: IQueryString) {
    return this.userService.findAll(user.role, queryString);
  }

  @Auth(Role.USER)
  @Get('suggest-following')
  suggestFollowersOfMyFollowing(
    @User() user: CreateUserDto,
    @Query() queryString: IQueryString,
  ) {
    return this.userService.suggestFollowersOfMyFollowing(user, queryString);
  }

  @Get('me')
  getMe(@User() user: CreateUserDto) {
    return this.userService.getMe(user.username);
  }

  @Patch('update-me')
  updateMe(@User() user: CreateUserDto, @Body() body: UpdateUserDto) {
    return this.userService.updateMe(user.username, body, user.role as Role);
  }

  @Patch('update-me-password')
  updateMePassword(@User() user: CreateUserDto, @Body() body: UpdateUserDto) {
    return this.userService.updateMePassword(user.id, body);
  }

  @Delete('delete-me')
  deleteMe(@User() user: CreateUserDto) {
    return this.userService.deleteMe(user.username);
  }

  @Patch('update-theme')
  @HttpCode(HttpStatus.NO_CONTENT)
  updateTheme(@User() user: CreateUserDto, @Body() body: UpdateUserDto) {
    return this.userService.updateTheme(user.username, body);
  }

  @Patch('update-language')
  @HttpCode(HttpStatus.NO_CONTENT)
  updateLanguage(@User() user: CreateUserDto, @Body() body: UpdateUserDto) {
    return this.userService.updateLanguage(user.username, body);
  }

  @Auth(Role.USER)
  @Get('user-followers/:username')
  findUserFollowers(
    @Param('username') username: string,
    @Query() queryString: IQueryString,
  ) {
    return this.userService.findUserFollowers(username, queryString);
  }

  @Auth(Role.USER)
  @Get('user-following/:username')
  findUserFollowing(
    @Param('username') username: string,
    @Query() queryString: IQueryString,
  ) {
    return this.userService.findUserFollowing(username, queryString);
  }

  @Auth(Role.USER)
  @Patch('deactivate')
  deactivate(@User() user: UpdateUserDto) {
    return this.userService.deactivate(user);
  }

  @Patch('upload-avatar/:username')
  @UseInterceptors(FileInterceptor('file', avatarMulterOptions))
  uploadAvatar(
    @User() user: UpdateUserDto,
    @Param('username') username: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 3 * 1000 * 1000 })],
      }),
    )
    avatar: Express.Multer.File,
  ) {
    return this.userService.uploadAvatar(user, username, avatar);
  }

  @Auth(Role.USER)
  @Get('for-users/:username')
  findOneForUsers(@Param('username') username: string) {
    return this.userService.findOneForUsers(username);
  }

  @Auth(Role.USER)
  @Patch('follow/:username')
  follow(@User() user: UpdateUserDto, @Param('username') username: string) {
    return this.userService.follow(user, username);
  }

  @Auth(Role.ADMIN)
  @Get(':username')
  findOne(@Param('username') username: string) {
    return this.userService.findOne(username);
  }

  @Auth(Role.ADMIN)
  @Patch(':username')
  update(@Param('username') username: string, @Body() body: UpdateUserDto) {
    return this.userService.update(username, body);
  }

  @Auth(Role.ADMIN)
  @Patch('update-password/:username')
  updatePassword(
    @Param('username') username: string,
    @Body() userData: UpdateUserDto,
  ) {
    const { password, confirmPassword } = userData;
    return this.userService.updatePassword(username, {
      password,
      confirmPassword,
    });
  }

  @Auth(Role.ADMIN)
  @Delete(':username')
  delete(@Param('username') username: string) {
    return this.userService.delete(username);
  }

  @Auth(Role.ADMIN)
  @Delete()
  deleteAll() {
    return this.userService.deleteAll();
  }
}
