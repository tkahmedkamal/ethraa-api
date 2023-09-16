import { ConfigService } from '@nestjs/config';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    cloud_name: config.get<string>('CLOUD_NAME'),
    api_key: config.get<string>('API_KEY'),
    api_secret: config.get<string>('API_SECRET'),
    secure: true,
  }),
};
