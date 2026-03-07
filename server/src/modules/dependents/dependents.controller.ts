import { Controller, Get, Param } from '@nestjs/common';
import { DependentsService } from './dependents.service';

@Controller({ path: 'dependents', version: '1' })
export class DependentsController {
  constructor(private readonly dependentsService: DependentsService) {}

  @Get('by-employee/:employeeNumber')
  async getDependentsByEmployeeNumber(
    @Param('employeeNumber') employeeNumber: string,
  ) {
    return this.dependentsService.getDependentsByEmployeeNumber(employeeNumber);
  }
}
