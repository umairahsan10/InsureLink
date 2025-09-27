import { Module } from '@nestjs/common';
import { InsurersController } from './insurers.controller';
import { InsurersService } from './insurers.service';
import { InsurersRepository } from './repositories/insurers.repository';

@Module({
  controllers: [InsurersController],
  providers: [InsurersService, InsurersRepository],
  exports: [InsurersService],
})
export class InsurersModule {}

