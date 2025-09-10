/* eslint-disable prettier/prettier */
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    cloudinary.config({
      cloud_name: 'dxtjxxjbx',
      api_key: '377916524128891',
      api_secret: 'MG9sntVfaq_aFfOlGSRZcnQRioI',
    });
    return cloudinary;
  },
};
