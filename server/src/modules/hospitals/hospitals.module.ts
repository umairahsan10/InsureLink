import { Module } from '@nestjs/common';
import { HospitalsController } from './hospitals.controller';
import { HospitalsService } from './hospitals.service';
import { HospitalsRepository } from './repositories/hospitals.repository';

@Module({
  controllers: [HospitalsController],
  providers: [HospitalsService, HospitalsRepository],
  exports: [HospitalsService],
})
export class HospitalsModule {}

