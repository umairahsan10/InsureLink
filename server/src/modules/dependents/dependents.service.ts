import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DependentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDependentsByEmployeeNumber(employeeNumber: string) {
    // Find employee by employee number
    const employee = await this.prisma.employee.findUnique({
      where: { employeeNumber },
    });

    if (!employee) {
      throw new NotFoundException(
        `Employee with number ${employeeNumber} not found`,
      );
    }

    // Fetch approved/active dependents for this employee
    const dependents = await this.prisma.dependent.findMany({
      where: {
        employeeId: employee.id,
        status: {
          in: ['Active', 'Approved'],
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        relationship: true,
      },
    });

    return dependents;
  }
}
