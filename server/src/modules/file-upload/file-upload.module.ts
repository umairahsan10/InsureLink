import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileUploadService } from './file-upload.service';
import { SupabaseStorageProvider } from './providers/supabase.provider';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [FileUploadService, SupabaseStorageProvider],
  exports: [FileUploadService],
})
export class FileUploadModule {}
