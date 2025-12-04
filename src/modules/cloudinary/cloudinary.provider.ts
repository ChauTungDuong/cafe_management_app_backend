import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';
import { v2 as cloudinary } from 'cloudinary';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: (configService: ConfigService<AllConfigType>) => {
    const cloudinaryConfig = configService.get('cloudinary', { infer: true });

    cloudinary.config({
      cloud_name: cloudinaryConfig?.cloud_name,
      api_key: cloudinaryConfig?.api_key,
      api_secret: cloudinaryConfig?.api_secret,
    });

    return cloudinary;
  },
  inject: [ConfigService],
};
