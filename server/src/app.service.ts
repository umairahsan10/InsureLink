import { Injectable } from '@nestjs/common';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async extractFirstImageFromPDF(pdfBuffer: Buffer): Promise<Buffer> {
    try {
      // Load PDF
      const pdf = await pdfjs.getDocument({ data: pdfBuffer }).promise;
      const page = await pdf.getPage(1);

      // Get resources
      const resources = await page.getResources();

      if (resources && resources.has('XObject')) {
        const xobjects = resources.get('XObject');

        for (const [name, ref] of xobjects) {
          try {
            const obj = await ref.fetchIfRef?.() ?? ref;

            if (obj.get('Subtype')?.name === 'Image') {
              const width = obj.get('Width');
              const height = obj.get('Height');
              const colorSpace = obj.get('ColorSpace');

              console.log(`Found image: ${width}x${height}`);

              // Get raw image bytes
              const imageStream = obj;
              const imageData = await imageStream.getBytes();

              // Return as buffer - this will be the raw image data
              return Buffer.from(imageData);
            }
          } catch (err) {
            console.error(`Error processing ${name}:`, err);
          }
        }
      }

      throw new Error('No images found in PDF');
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw error;
    }
  }
}

