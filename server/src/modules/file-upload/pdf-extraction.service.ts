import { Injectable } from '@nestjs/common';
// TODO: pdfjs-dist not yet installed — install with: npm install pdfjs-dist
// import * as PDFDocument from 'pdfjs-dist/legacy/build/pdf';

@Injectable()
export class PdfExtractionService {
  async extractFirstImageFromPDF(pdfBuffer: Buffer): Promise<Buffer> {
    // TODO: Implement PDF extraction once pdfjs-dist is installed
    throw new Error('PDF extraction not yet implemented. Install pdfjs-dist to enable.');
  }
}
