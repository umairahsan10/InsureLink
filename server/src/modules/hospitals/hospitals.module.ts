import { Module } from '@nestjs/common';
import { HospitalsController } from './hospitals.controller';
import { HospitalsService } from './hospitals.service';
import { HospitalsRepository } from './repositories/hospitals.repository';
import { HospitalEmergencyContactsRepository } from './repositories/hospital-emergency-contacts.repository';
import { HospitalVisitsRepository } from './repositories/hospital-visits.repository';
import { HospitalFinderService } from './services/hospital-finder.service';

@Module({
  controllers: [HospitalsController],
  providers: [
    HospitalsService,
    HospitalFinderService,
    HospitalsRepository,
    HospitalEmergencyContactsRepository,
    HospitalVisitsRepository,
  ],
  exports: [HospitalsService, HospitalFinderService],
})
export class HospitalsModule {}

