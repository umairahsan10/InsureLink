import { Module } from '@nestjs/common';
import { CorporatesController } from './corporates.controller';
import { CorporatesService } from './corporates.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CorporatesController],
  providers: [CorporatesService],
  exports: [CorporatesService],
})
export class CorporatesModule {}

