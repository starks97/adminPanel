import { Injectable } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';

import toStream = require('buffer-to-stream');

@Injectable()
export class CloudinarySystemService {
  async upload(
    files: Express.Multer.File[],
  ): Promise<Pick<UploadApiResponse, 'url' | 'resource_type'>[]> {
    const uploadPromises = files.map(file => {
      return new Promise<Pick<UploadApiResponse, 'url' | 'resource_type'>>((resolve, reject) => {
        const uploadStream = v2.uploader.upload_stream(
          { folder: 'blog/', use_filename: true },
          (error: Error, result: UploadApiResponse) => {
            if (error) {
              reject(error.message);
            } else {
              resolve({
                url: result.url,
                resource_type: result.resource_type,
              });
            }
          },
        );

        toStream(file.buffer).pipe(uploadStream);
      });
    });

    return Promise.all(uploadPromises);
  }

  async uploadSingle(file: Express.Multer.File) {
    return new Promise<Pick<UploadApiResponse, 'url' | 'resource_type'>>((resolve, reject) => {
      const uploadStream = v2.uploader.upload_stream(
        { folder: 'user/', use_filename: true },
        (error: Error, result: UploadApiResponse) => {
          if (error) {
            reject(error.message);
          } else {
            resolve({
              url: result.url,
              resource_type: result.resource_type,
            });
          }
        },
      );

      toStream(file.buffer).pipe(uploadStream);
    });
  }
}
