import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Hospital } from '@prisma/client';
import { CreateHospitalDto } from '../dto/create-hospital.dto';
import { UpdateHospitalDto } from '../dto/update-hospital.dto';

@Injectable()
export class HospitalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateHospitalDto & { userId: string }): Promise<Hospital> {
    return this.prisma.hospital.create({
      data: {
        userId: data.userId,
        hospitalName: data.hospitalName,
        licenseNumber: data.licenseNumber,
        city: data.city,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        emergencyPhone: data.emergencyPhone,
        hospitalType: data.hospitalType || 'reimbursable',
        hasEmergencyUnit: data.hasEmergencyUnit ?? true,
        isActive: data.isActive ?? true,
      },
    });
  }

  async findById(id: string): Promise<Hospital | null> {
    return this.prisma.hospital.findUnique({
      where: { id },
      include: {
        emergencyContacts: true,
        hospitalVisits: {
          orderBy: { visitDate: 'desc' },
          take: 10,
        },
      },
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    city?: string,
    isActive?: boolean,
    sortBy: string = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<{ hospitals: Hospital[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive',
      };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [hospitals, total] = await Promise.all([
      this.prisma.hospital.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: {
          emergencyContacts: true,
        },
      }),
      this.prisma.hospital.count({ where }),
    ]);

    return { hospitals, total };
  }

  async update(id: string, data: UpdateHospitalDto): Promise<Hospital> {
    return this.prisma.hospital.update({
      where: { id },
      data: {
        ...(data.hospitalName && { hospitalName: data.hospitalName }),
        ...(data.city && { city: data.city }),
        ...(data.address && { address: data.address }),
        ...(data.latitude && { latitude: data.latitude }),
        ...(data.longitude && { longitude: data.longitude }),
        ...(data.emergencyPhone && { emergencyPhone: data.emergencyPhone }),
        ...(data.hospitalType && { hospitalType: data.hospitalType }),
        ...(typeof data.hasEmergencyUnit !== 'undefined' && {
          hasEmergencyUnit: data.hasEmergencyUnit,
        }),
        ...(typeof data.isActive !== 'undefined' && {
          isActive: data.isActive,
        }),
      },
      include: {
        emergencyContacts: true,
      },
    });
  }

  async delete(id: string): Promise<Hospital> {
    return this.prisma.hospital.delete({
      where: { id },
    });
  }

  async findByLicenseNumber(licenseNumber: string): Promise<Hospital | null> {
    return this.prisma.hospital.findUnique({
      where: { licenseNumber },
    });
  }

  async findByCity(city: string, isActive?: boolean): Promise<Hospital[]> {
    return this.prisma.hospital.findMany({
      where: {
        city: {
          contains: city,
          mode: 'insensitive',
        },
        ...(isActive !== undefined && { isActive }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findNear(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
  ): Promise<Hospital[]> {
    // PostgreSQL PostGIS query using raw SQL
    // Using Haversine formula for distance calculation
    const hospitals = await this.prisma.$queryRaw<Hospital[]>`
      SELECT *
      FROM hospitals
      WHERE 
        latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND is_active = true
        AND (
          6371 * acos(
            cos(radians(${latitude})) * cos(radians(latitude)) * cos(
              radians(longitude) - radians(${longitude})
            ) + sin(radians(${latitude})) * sin(radians(latitude))
          )
        ) <= ${radiusKm}
      ORDER BY
        6371 * acos(
          cos(radians(${latitude})) * cos(radians(latitude)) * cos(
            radians(longitude) - radians(${longitude})
          ) + sin(radians(${latitude})) * sin(radians(latitude))
        )
    `;
    return hospitals;
  }
}
