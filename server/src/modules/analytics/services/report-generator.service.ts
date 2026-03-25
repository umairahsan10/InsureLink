import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportGeneratorService {
  async generateReport(data: any) {
    return 'Report Generated';
  }
}
