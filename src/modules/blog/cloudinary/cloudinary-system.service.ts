import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { v2, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

const cloudinary = v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

export interface UploadedFile {
  filename: string;
  url: string;
}

@Injectable()
export class CloudinarySystemService {
  async upload(files: Express.Multer.File[]): Promise<UploadedFile[]> {
    try {
      const uploadedFiles: UploadedFile[] = [];

      for (let file of files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'blog',
          use_filename: true,
        });

        if (!result) throw new Error('something happend with the file');

        uploadedFiles.push(result);
      }

      return uploadedFiles;
    } catch (e) {
      console.log(e.message);
    }
  }
}
