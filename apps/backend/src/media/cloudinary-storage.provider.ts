import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { StorageProvider, StoredFile } from './storage-provider.interface';

const RESOURCE_TYPE_BY_EXTENSION: Record<string, 'image' | 'video' | 'raw'> = {
  jpg: 'image',
  png: 'image',
  webp: 'image',
  mp4: 'video',
  mov: 'video',
  m4a: 'video',
  mp3: 'video',
  wav: 'video',
  pdf: 'raw',
};

/**
 * Persists to Cloudinary's free tier instead of local disk — needed on hosts
 * (e.g. Render's free plan) whose filesystem doesn't survive a restart. Picked
 * up automatically by MediaModule when CLOUDINARY_URL is set; same interface
 * as LocalDiskStorageProvider, so nothing else in the codebase changes.
 */
@Injectable()
export class CloudinaryStorageProvider implements StorageProvider {
  async save(buffer: Buffer, opts: { mimeType: string; extension: string }): Promise<StoredFile> {
    const resourceType = RESOURCE_TYPE_BY_EXTENSION[opts.extension] ?? 'raw';
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { resource_type: resourceType, folder: 'mekamemo' },
        (err, res) => (err || !res ? reject(err) : resolve(res)),
      );
      upload.end(buffer);
    });
    return { url: result.secure_url };
  }
}
