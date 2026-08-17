import { Inject, Injectable } from '@nestjs/common';
import { STORAGE_PROVIDER } from './storage-provider.interface';
import type { StorageProvider } from './storage-provider.interface';

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'audio/m4a': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'application/pdf': 'pdf',
};

@Injectable()
export class MediaService {
  constructor(@Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider) {}

  async upload(file: { buffer: Buffer; mimetype: string }) {
    const extension = EXTENSION_BY_MIME[file.mimetype] ?? 'bin';
    const stored = await this.storage.save(file.buffer, { mimeType: file.mimetype, extension });
    return { url: stored.url, mimeType: file.mimetype };
  }
}
