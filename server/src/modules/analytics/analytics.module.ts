import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { FraudDetectionService } from './services/fraud-detection.service';
import { TrendAnalysisService } from './services/trend-analysis.service';
import { ReportGeneratorService } from './services/report-generator.service';

@Module({
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    FraudDetectionService,
    TrendAnalysisService,
    ReportGeneratorService,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}



