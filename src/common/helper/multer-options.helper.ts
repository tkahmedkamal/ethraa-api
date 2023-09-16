import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

export const avatarMulterOptions = {
  storage: memoryStorage(),
  fileFilter: (req: Request, file: Express.Multer.File, cb) => {
    if (file?.mimetype.startsWith('image')) {
      cb(null, true);

      return;
    }

    cb(new BadRequestException('Invalid File, must be an image'), false);
  },
};
