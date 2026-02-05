import { Controller } from '@nestjs/common';
import { DependentsService } from './dependents.service';

@Controller('dependents')
export class DependentsController {
  constructor(private readonly dependentsService: DependentsService) {}
}
