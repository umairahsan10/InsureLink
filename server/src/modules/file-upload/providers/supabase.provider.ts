import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

export interface UploadResult {
  filePath: string;
  publicUrl: string;
  fileSize: number;
}

@Injectable()
export class SupabaseStorageProvider {
  private readonly logger = new Logger(SupabaseStorageProvider.name);
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    this.bucketName = this.configService.get<string>(
      'SUPABASE_BUCKET_NAME',
      'claim-documents',
    );

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error(
        'Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env',
      );
      throw new Error('Supabase configuration missing');
    }

    // Normalize bucket value to allow quoted names in .env
    this.bucketName = this.bucketName?.replace(/^['"]|['"]$/g, '') || 'claim-documents';

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.logger.log(
      `Supabase Storage initialized with bucket: ${this.bucketName}`,
    );
  }

  /**
   * Upload a file to Supabase Storage
   * @param file - Multer file object
   * @param folder - Folder path within the bucket (e.g., 'claims')
   * @returns Upload result with file path and public URL
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'claims',
  ): Promise<UploadResult> {
    try {
      // Generate unique filename
      const fileExtension = file.originalname.split('.').pop();
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const filePath = `${folder}/${uniqueFilename}`;

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        this.logger.error(`Supabase upload error: ${error.message}`, error);
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = this.supabase.storage.from(this.bucketName).getPublicUrl(filePath);

      this.logger.log(`File uploaded successfully: ${filePath}`);

      return {
        filePath: data.path,
        publicUrl,
        fileSize: file.size,
      };
    } catch (error) {
      this.logger.error('Error uploading file to Supabase', error);
      throw error;
    }
  }

  /**
   * Delete a file from Supabase Storage
   * @param filePath - Path to the file within the bucket
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        this.logger.error(`Failed to delete file: ${error.message}`, error);
        throw new Error(`Failed to delete file: ${error.message}`);
      }

      this.logger.log(`File deleted successfully: ${filePath}`);
    } catch (error) {
      this.logger.error('Error deleting file from Supabase', error);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   * @param filePath - Path to the file within the bucket
   */
  getPublicUrl(filePath: string): string {
    const {
      data: { publicUrl },
    } = this.supabase.storage.from(this.bucketName).getPublicUrl(filePath);
    return publicUrl;
  }
}
