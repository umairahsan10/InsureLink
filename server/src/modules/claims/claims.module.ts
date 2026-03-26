import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';
import { ClaimsRepository } from './repositories/claims.repository';
import { ClaimEventsRepository } from './repositories/claim-events.repository';
import { ClaimDocumentsRepository } from './repositories/claim-documents.repository';
import { ClaimProcessingService } from './services/claim-processing.service';
import { ClaimValidationService } from './workflows/claim-validation.service';
import { PaymentQueueService } from './workflows/payment-queue.service';
import { RulesEngineService } from './workflows/rules-engine.service';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MulterModule.register({
      storage: 'memory',
    }),
    FileUploadModule,
    AuditModule,
  ],
  controllers: [ClaimsController],
  providers: [
    ClaimsService,
    ClaimsRepository,
    ClaimEventsRepository,
    ClaimDocumentsRepository,
    ClaimProcessingService,
    ClaimValidationService,
    PaymentQueueService,
    RulesEngineService,
  ],
  exports: [ClaimsService],
})
export class ClaimsModule {}
