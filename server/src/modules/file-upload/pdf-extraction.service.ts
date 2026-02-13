import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfjs-dist/legacy/build/pdf';

@Injectable()
export class PdfExtractionService {
  async extractFirstImageFromPDF(pdfBuffer: Buffer): Promise<Buffer> {
    // Load the PDF document
    const pdf = await PDFDocument.getDocument({ data: pdfBuffer }).promise;

    // Get the first page
    const page = await pdf.getPage(1);

    // Get page resources
    const resources = await page.getResources();

    // Look for images in XObjects
    if (resources && resources.has('XObject')) {
      const xobjectRef = resources.get('XObject');

      for (const [name, ref] of xobjectRef) {
        try {
          const xobject = await ref.fetchIfRef();

          // Check if it's an image
          if (xobject.get('Subtype')?.name === 'Image') {
            const width = xobject.get('Width');
            const height = xobject.get('Height');
            const colorSpace = xobject.get('ColorSpace');

            console.log(`Found image: ${width}x${height}`);

            // Get the raw image data
            const imageStream = xobject;
            const imageData = await imageStream.getBytes();

            // For now, return the raw data
            // In production, you'd convert this to PNG/JPEG properly
            // This requires proper handling of color spaces and compression
            return Buffer.from(imageData);
          }
        } catch (err) {
          console.error(`Error processing XObject ${name}:`, err);
        }
      }
    }

    throw new Error('No images found in PDF');
  }
}
