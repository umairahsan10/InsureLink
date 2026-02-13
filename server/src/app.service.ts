import { Injectable } from '@nestjs/common';
import { PrismaService } from './common/prisma/prisma.service';
// TODO: pdfjs-dist not yet installed — install with: npm install pdfjs-dist
// import * as pdfjs from 'pdfjs-dist';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getDatabaseHealth(): Promise<{
    ok: boolean;
    userCount: number | null;
  }> {
    try {
      const userCount = await this.prisma.user.count();
      return { ok: true, userCount };
    } catch {
      return { ok: false, userCount: null };
    }
  }

  async extractFirstImageFromPDF(pdfBuffer: Buffer): Promise<Buffer> {
    // TODO: Implement PDF extraction once pdfjs-dist is installed
    throw new Error(
      'PDF extraction not yet implemented. Install pdfjs-dist to enable.',
    );
  }
}
