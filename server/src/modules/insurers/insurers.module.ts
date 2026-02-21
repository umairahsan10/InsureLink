import { Module } from '@nestjs/common';
import { InsurersController } from './insurers.controller';
import { InsurersService } from './insurers.service';
import { InsurersRepository } from './repositories/insurers.repository';
import { PlansRepository } from './repositories/plans.repository';
import { LabsRepository } from './repositories/labs.repository';

@Module({
  controllers: [InsurersController],
  providers: [
    InsurersService,
    InsurersRepository,
    PlansRepository,
    LabsRepository,
  ],
  exports: [InsurersService],
})
export class InsurersModule {}

