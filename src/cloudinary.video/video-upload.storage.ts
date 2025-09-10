/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
// src/video/video-upload.storage.ts
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: 'dxtjxxjbx',
    api_key: '377916524128891',
    api_secret: 'MG9sntVfaq_aFfOlGSRZcnQRioI',
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const uniqueId = `${Date.now()}`;
    return {
      folder: 'user_videos',
      public_id: uniqueId,
      resource_type: 'video', 
      format: 'mp4', 
    };
  },
});
