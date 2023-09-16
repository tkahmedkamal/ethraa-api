import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private cloudinaryConfig: any) {
    cloudinary.config(this.cloudinaryConfig);
  }
  async uploadFile(file: string, folder: string, fileId) {
    try {
      const image = await cloudinary.uploader.upload(file, {
        resource_type: 'image',
        folder,
        public_id: fileId,
      });

      return image?.secure_url;
    } catch (error) {
      throw new ForbiddenException('errors.global.cloudinary_image');
    }
  }
}
