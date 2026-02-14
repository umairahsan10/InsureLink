import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { HospitalVisit } from '@prisma/client';
import { CreateHospitalVisitDto } from '../dto/hospital-visit.dto';

@Injectable()
export class HospitalVisitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateHospitalVisitDto): Promise<HospitalVisit> {
    return this.prisma.hospitalVisit.create({
      data: {
        employeeId: data.employeeId,
        dependentId: data.dependentId,
        hospitalId: data.hospitalId,
        visitDate: new Date(data.visitDate),
        dischargeDate: data.dischargeDate ? new Date(data.dischargeDate) : null,
      },
    });
  }

  async findById(id: string): Promise<HospitalVisit | null> {
    return this.prisma.hospitalVisit.findUnique({
      where: { id },
      include: {
        employee: true,
        dependent: true,
        hospital: true,
      },
    });
  }

  async findByHospitalId(hospitalId: string): Promise<HospitalVisit[]> {
    return this.prisma.hospitalVisit.findMany({
      where: { hospitalId },
      orderBy: { visitDate: 'desc' },
      include: {
        employee: true,
        dependent: true,
        hospital: true,
      },
    });
  }

  async findByEmployeeId(employeeId: string): Promise<HospitalVisit[]> {
    return this.prisma.hospitalVisit.findMany({
      where: { employeeId },
      orderBy: { visitDate: 'desc' },
      include: {
        hospital: true,
      },
    });
  }

  async findByDependentId(dependentId: string): Promise<HospitalVisit[]> {
    return this.prisma.hospitalVisit.findMany({
      where: { dependentId },
      orderBy: { visitDate: 'desc' },
      include: {
        hospital: true,
      },
    });
  }

  async update(id: string, dischargeDate: Date): Promise<HospitalVisit> {
    return this.prisma.hospitalVisit.update({
      where: { id },
      data: { dischargeDate },
    });
  }

  async delete(id: string): Promise<HospitalVisit> {
    return this.prisma.hospitalVisit.delete({
      where: { id },
    });
  }
}
