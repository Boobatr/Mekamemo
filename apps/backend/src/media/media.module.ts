import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { LocalDiskStorageProvider } from './local-disk-storage.provider';
import { CloudinaryStorageProvider } from './cloudinary-storage.provider';
import { STORAGE_PROVIDER } from './storage-provider.interface';

@Module({
  providers: [
    LocalDiskStorageProvider,
    CloudinaryStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useExisting: process.env.CLOUDINARY_URL ? CloudinaryStorageProvider : LocalDiskStorageProvider,
    },
    MediaService,
  ],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule {}
