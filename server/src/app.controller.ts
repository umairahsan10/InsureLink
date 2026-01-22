import { Controller, Get, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('extract-pdf-image')
  @UseInterceptors(FileInterceptor('pdf'))
  async extractPdfImage(@UploadedFile() file: Express.Multer.File): Promise<Buffer> {
    if (!file) {
      throw new Error('No PDF file provided');
    }
    return this.appService.extractFirstImageFromPDF(file.buffer);
  }
}

