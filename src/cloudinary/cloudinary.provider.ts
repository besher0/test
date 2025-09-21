import { v2 as cloudinary } from 'cloudinary';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  inject: [],
  useFactory: () => {
    cloudinary.config({
      cloud_name: 'dxtjxxjbx',
      api_key: '377916524128891',
      api_secret: 'MG9sntVfaq_aFfOlGSRZcnQRioI',
    });
    return cloudinary;
  },
};
