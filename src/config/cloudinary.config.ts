import { registerAs } from '@nestjs/config';
import { CloudinaryConfig } from './types/cloudinary.type';

export default registerAs(
  'cloudinary',
  (): CloudinaryConfig => ({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  }),
);
