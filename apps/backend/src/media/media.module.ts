import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { LocalDiskStorageProvider } from './local-disk-storage.provider';
import { STORAGE_PROVIDER } from './storage-provider.interface';

@Module({
  providers: [
    LocalDiskStorageProvider,
    { provide: STORAGE_PROVIDER, useExisting: LocalDiskStorageProvider },
    MediaService,
  ],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule {}
