import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ObjectId } from 'bson';
import { Auth } from '../auth/decorators';
import { Role } from '../common/enums';
import { CreateUserDto } from '../user/dto';
import { User } from '../common/decorators';
import { IQueryString } from '../common/interfaces';
import { BookmarkService } from './bookmark.service';
import { CreateBookmarkDto } from './dto';

@Controller('api/bookmarks')
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Auth(Role.ADMIN)
  @Get()
  findAll(@Query() queryString: IQueryString) {
    return this.bookmarkService.findAll(queryString);
  }

  @Auth(Role.USER)
  @Get('find-for-user')
  findAllForUser(
    @User() user: CreateUserDto,
    @Query() queryString: IQueryString,
  ) {
    return this.bookmarkService.findAllForUser(user.id, queryString);
  }

  @Auth(Role.USER)
  @Post()
  create(@User() user: CreateUserDto, @Body() body: CreateBookmarkDto) {
    return this.bookmarkService.create(user.id, body);
  }

  @Auth(Role.ADMIN)
  @Delete(':id')
  delete(@Param('id') id: ObjectId) {
    return this.bookmarkService.delete(id);
  }

  @Auth(Role.ADMIN)
  @Delete()
  deleteAll() {
    return this.bookmarkService.deleteAll();
  }
}
