import { Module } from '@nestjs/common';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';
import { ClaimsRepository } from './repositories/claims.repository';
import { ClaimValidationService } from './workflows/claim-validation.service';
import { PaymentQueueService } from './workflows/payment-queue.service';
import { RulesEngineService } from './workflows/rules-engine.service';

@Module({
  controllers: [ClaimsController],
  providers: [
    ClaimsService,
    ClaimsRepository,
    ClaimValidationService,
    PaymentQueueService,
    RulesEngineService,
  ],
  exports: [ClaimsService],
})
export class ClaimsModule {}



