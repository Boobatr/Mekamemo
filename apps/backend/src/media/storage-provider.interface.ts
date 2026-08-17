export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';

export interface StoredFile {
  url: string;
}

export interface StorageProvider {
  save(buffer: Buffer, opts: { mimeType: string; extension: string }): Promise<StoredFile>;
}
