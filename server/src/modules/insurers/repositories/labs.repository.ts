import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Lab } from '@prisma/client';
import { CreateLabDto, UpdateLabDto } from '../dto/create-lab.dto';

@Injectable()
export class LabsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(insurerId: string, data: CreateLabDto): Promise<Lab> {
    return this.prisma.lab.create({
      data: {
        insurerId,
        labName: data.labName,
        city: data.city,
        address: data.address,
        licenseNumber: data.licenseNumber,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        testCategories: data.testCategories,
        isActive: data.isActive ?? true,
      },
    });
  }

  async findById(id: string): Promise<Lab | null> {
    return this.prisma.lab.findUnique({
      where: { id },
      include: {
        insurer: true,
      },
    });
  }

  async findByIdSimple(id: string): Promise<Lab | null> {
    return this.prisma.lab.findUnique({
      where: { id },
    });
  }

  async findByInsurerId(insurerId: string, isActive?: boolean): Promise<Lab[]> {
    return this.prisma.lab.findMany({
      where: {
        insurerId,
        ...(typeof isActive !== 'undefined' && { isActive }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: UpdateLabDto): Promise<Lab> {
    return this.prisma.lab.update({
      where: { id },
      data: {
        ...(data.labName && { labName: data.labName }),
        ...(data.city && { city: data.city }),
        ...(data.address && { address: data.address }),
        ...(data.contactPhone && { contactPhone: data.contactPhone }),
        ...(data.contactEmail && { contactEmail: data.contactEmail }),
        ...(data.testCategories && { testCategories: data.testCategories }),
        ...(typeof data.isActive !== 'undefined' && {
          isActive: data.isActive,
        }),
      },
    });
  }

  async delete(id: string): Promise<Lab> {
    return this.prisma.lab.delete({
      where: { id },
    });
  }

  async findByLicenseNumber(licenseNumber: string): Promise<Lab | null> {
    return this.prisma.lab.findUnique({
      where: { licenseNumber },
    });
  }
}
