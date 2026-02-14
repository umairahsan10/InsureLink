import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Insurer } from '@prisma/client';
import { CreateInsurerDto } from '../dto/create-insurer.dto';
import { UpdateInsurerDto } from '../dto/update-insurer.dto';

@Injectable()
export class InsurersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateInsurerDto & { userId: string }): Promise<Insurer> {
    return this.prisma.insurer.create({
      data: {
        userId: data.userId,
        companyName: data.companyName,
        licenseNumber: data.licenseNumber,
        address: data.address,
        city: data.city,
        province: data.province,
        maxCoverageLimit: data.maxCoverageLimit,
        networkHospitalCount: data.networkHospitalCount ?? 0,
        corporateClientCount: data.corporateClientCount ?? 0,
        status: data.status || 'Active',
        operatingSince: new Date(data.operatingSince),
        isActive: data.isActive ?? true,
      },
    });
  }

  async findById(id: string): Promise<Insurer | null> {
    return this.prisma.insurer.findUnique({
      where: { id },
      include: {
        plans: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
        labs: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
        corporates: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    city?: string,
    status?: string,
    sortBy: string = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<{ insurers: Insurer[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive',
      };
    }

    if (status) {
      where.status = status;
    }

    const [insurers, total] = await Promise.all([
      this.prisma.insurer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: {
          plans: {
            where: { isActive: true },
          },
          _count: {
            select: {
              corporates: true,
              plans: true,
              labs: true,
              claims: true,
            },
          },
        },
      }),
      this.prisma.insurer.count({ where }),
    ]);

    return { insurers, total };
  }

  async update(id: string, data: UpdateInsurerDto): Promise<Insurer> {
    return this.prisma.insurer.update({
      where: { id },
      data: {
        ...(data.companyName && { companyName: data.companyName }),
        ...(data.address && { address: data.address }),
        ...(data.city && { city: data.city }),
        ...(data.province && { province: data.province }),
        ...(data.maxCoverageLimit && { maxCoverageLimit: data.maxCoverageLimit }),
        ...(typeof data.networkHospitalCount !== 'undefined' && {
          networkHospitalCount: data.networkHospitalCount,
        }),
        ...(typeof data.corporateClientCount !== 'undefined' && {
          corporateClientCount: data.corporateClientCount,
        }),
        ...(data.status && { status: data.status }),
        ...(data.operatingSince && {
          operatingSince: new Date(data.operatingSince),
        }),
        ...(typeof data.isActive !== 'undefined' && {
          isActive: data.isActive,
        }),
      },
      include: {
        plans: true,
        labs: true,
      },
    });
  }

  async delete(id: string): Promise<Insurer> {
    return this.prisma.insurer.delete({
      where: { id },
    });
  }

  async findByLicenseNumber(licenseNumber: string): Promise<Insurer | null> {
    return this.prisma.insurer.findUnique({
      where: { licenseNumber },
    });
  }
}
