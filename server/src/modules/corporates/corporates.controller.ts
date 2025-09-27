import { Controller } from '@nestjs/common';
import { CorporatesService } from './corporates.service';

@Controller('corporates')
export class CorporatesController {
  constructor(private readonly corporatesService: CorporatesService) {}
}
