import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { HospitalVisit, HospitalVisitStatus } from '@prisma/client';
import { CreateHospitalVisitDto } from '../dto/hospital-visit.dto';

@Injectable()
export class HospitalVisitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateHospitalVisitDto & { employeeId: string; dependentId?: string },
  ): Promise<HospitalVisit> {
    return this.prisma.hospitalVisit.create({
      data: {
        employeeId: data.employeeId,
        dependentId: data.dependentId || null,
        hospitalId: data.hospitalId,
        visitDate: new Date(data.visitDate),
        dischargeDate: data.dischargeDate ? new Date(data.dischargeDate) : null,
        status: HospitalVisitStatus.Pending,
      },
    });
  }

  async findById(id: string): Promise<HospitalVisit | null> {
    return this.prisma.hospitalVisit.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
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
        employee: {
          include: {
            user: true,
          },
        },
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

  /**
   * Find unclaimed (Pending) visits for an employee at a specific hospital
   * Returns visits ordered by visitDate DESC (most recent first)
   */
  async findUnclaimedByEmployeeAndHospital(
    employeeId: string,
    hospitalId: string,
  ): Promise<HospitalVisit[]> {
    return this.prisma.hospitalVisit.findMany({
      where: {
        employeeId,
        hospitalId,
        status: HospitalVisitStatus.Pending,
      },
      orderBy: { visitDate: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            designation: true,
            department: true,
            corporate: {
              select: {
                id: true,
                name: true,
              },
            },
            plan: {
              select: {
                id: true,
                planName: true,
                planCode: true,
                insurerId: true,
                sumInsured: true,
              },
            },
          },
        },
        dependent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            relationship: true,
          },
        },
        hospital: {
          select: {
            id: true,
            hospitalName: true,
          },
        },
      },
    });
  }

  /**
   * Lightweight version: Find unclaimed visits with minimal data
   * Optimized for claim creation workflow where employee data is already known
   */
  async findUnclaimedByEmployeeAndHospitalLightweight(
    employeeId: string,
    hospitalId: string,
  ): Promise<HospitalVisit[]> {
    return this.prisma.hospitalVisit.findMany({
      where: {
        employeeId,
        hospitalId,
        status: HospitalVisitStatus.Pending,
      },
      orderBy: { visitDate: 'desc' },
      select: {
        id: true,
        visitDate: true,
        dischargeDate: true,
        status: true,
        employeeId: true,
        dependentId: true,
        hospitalId: true,
        createdAt: true,
        updatedAt: true,
        dependent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            relationship: true,
          },
        },
      },
    }) as Promise<HospitalVisit[]>;
  }

  /**
   * Update the status of a hospital visit
   */
  async updateStatus(
    id: string,
    status: HospitalVisitStatus,
  ): Promise<HospitalVisit> {
    return this.prisma.hospitalVisit.update({
      where: { id },
      data: { status },
    });
  }
}
