import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as cloudinary,
} from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject('CLOUDINARY') private cloudinaryInstance: typeof cloudinary,
  ) {}

  async uploadImage(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const allowedType = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedType.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, JPG, and WEBP are allowed.',
      );
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'File size exceeds the maximum limit of 10MB.',
      );
    }
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinaryInstance.uploader.upload_stream(
        {
          folder: folder || 'cafe_management_payments_qr',
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<(UploadApiResponse | UploadApiErrorResponse)[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  async getImageInfo(publicId: string): Promise<UploadApiResponse> {
    try {
      return await this.cloudinaryInstance.api.resource(publicId);
    } catch (error) {
      throw new BadRequestException('Failed to get image info from Cloudinary');
    }
  }
  async deleteImage(publicId: string): Promise<void> {
    try {
      return await this.cloudinaryInstance.uploader.destroy(publicId);
    } catch (error) {
      throw new BadRequestException('Failed to delete image from Cloudinary');
    }
  }

  async deleteMultipleImages(publicIds: string[]): Promise<void> {
    try {
      return await this.cloudinaryInstance.api.delete_resources(publicIds);
    } catch (error) {
      throw new BadRequestException('Failed to delete images from Cloudinary');
    }
  }
}
