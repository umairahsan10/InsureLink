import { Module } from '@nestjs/common';
import { CorporatesController } from './corporates.controller';
import { CorporatesService } from './corporates.service';
import { CorporatesRepository } from './repositories/corporates.repository';

@Module({
  controllers: [CorporatesController],
  providers: [CorporatesService, CorporatesRepository],
  exports: [CorporatesService],
})
export class CorporatesModule {}

