import { Injectable } from '@nestjs/common';
import {
  SupabaseStorageProvider,
  UploadResult,
} from './providers/supabase.provider';

@Injectable()
export class FileUploadService {
  constructor(private readonly supabaseProvider: SupabaseStorageProvider) {}

  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'claims',
  ): Promise<UploadResult> {
    return this.supabaseProvider.uploadFile(file, folder);
  }

  /**
   * Delete file from Supabase Storage
   */
  async deleteFile(filePath: string): Promise<void> {
    return this.supabaseProvider.deleteFile(filePath);
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(filePath: string): string {
    return this.supabaseProvider.getPublicUrl(filePath);
  }
}
