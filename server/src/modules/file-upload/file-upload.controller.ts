import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FileUploadService } from './file-upload.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';

@Controller({ path: 'upload', version: '1' })
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  /**
   * Upload a file to Supabase Storage
   * POST /v1/upload
   */
  @Post()
  @Roles('hospital', 'insurer')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_req, file, callback) => {
        const allowedMimeTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new Error(
              `Invalid file type. Allowed: PDF, JPEG, PNG, DOCX. Received: ${file.mimetype}`,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
    @Body('folder') folder: string = 'chat-attachments',
    @CurrentUser() user: CurrentUserDto,
  ) {
    const validFolders = ['chat-attachments', 'general'];
    const targetFolder = validFolders.includes(folder)
      ? folder
      : 'chat-attachments';

    const result = await this.fileUploadService.uploadFile(file, targetFolder);

    return {
      originalFilename: file.originalname,
      filePath: result.filePath,
      fileUrl: result.publicUrl,
      fileSizeBytes: result.fileSize,
      mimeType: file.mimetype,
      uploadedBy: user.id,
    };
  }

  /**
   * Get file metadata (public URL + existence check)
   * GET /v1/upload/:filePath/metadata
   */
  @Get(':filePath/metadata')
  @Roles('hospital', 'insurer', 'corporate', 'admin')
  async getFileMetadata(@Param('filePath') filePath: string) {
    const decodedPath = decodeURIComponent(filePath);
    const publicUrl = this.fileUploadService.getPublicUrl(decodedPath);

    return {
      filePath: decodedPath,
      publicUrl,
    };
  }

  /**
   * Delete a file from Supabase Storage
   * DELETE /v1/upload/:filePath
   */
  @Delete(':filePath')
  @Roles('hospital', 'insurer')
  async deleteFile(@Param('filePath') filePath: string) {
    const decodedPath = decodeURIComponent(filePath);
    await this.fileUploadService.deleteFile(decodedPath);

    return {
      message: 'File deleted successfully',
      filePath: decodedPath,
    };
  }
}
