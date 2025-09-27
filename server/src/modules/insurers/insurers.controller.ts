import { Controller } from '@nestjs/common';
import { InsurersService } from './insurers.service';

@Controller('insurers')
export class InsurersController {
  constructor(private readonly insurersService: InsurersService) {}
}
