import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { Injectable } from '@nestjs/common';
import { StorageProvider, StoredFile } from './storage-provider.interface';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');

/**
 * Saves to the local filesystem, served statically at /uploads (see main.ts).
 * Swap for an S3/R2-backed StorageProvider in production — same interface,
 * one new class; nothing else in the codebase changes.
 */
@Injectable()
export class LocalDiskStorageProvider implements StorageProvider {
  async save(buffer: Buffer, opts: { mimeType: string; extension: string }): Promise<StoredFile> {
    await mkdir(UPLOADS_DIR, { recursive: true });
    const filename = `${randomUUID()}.${opts.extension}`;
    await writeFile(join(UPLOADS_DIR, filename), buffer);
    return { url: `/uploads/${filename}` };
  }
}
