import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { HospitalEmergencyContact } from '@prisma/client';
import { CreateHospitalEmergencyContactDto, UpdateHospitalEmergencyContactDto } from '../dto/hospital-emergency-contact.dto';

@Injectable()
export class HospitalEmergencyContactsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    hospitalId: string,
    data: CreateHospitalEmergencyContactDto,
  ): Promise<HospitalEmergencyContact> {
    return this.prisma.hospitalEmergencyContact.create({
      data: {
        hospitalId,
        contactLevel: data.contactLevel,
        designation: data.designation,
        name: data.name,
        contactNumber: data.contactNumber,
        isActive: data.isActive ?? true,
      },
    });
  }

  async findByHospitalId(hospitalId: string): Promise<HospitalEmergencyContact[]> {
    return this.prisma.hospitalEmergencyContact.findMany({
      where: { hospitalId },
      orderBy: { contactLevel: 'asc' },
    });
  }

  async findById(id: string): Promise<HospitalEmergencyContact | null> {
    return this.prisma.hospitalEmergencyContact.findUnique({
      where: { id },
    });
  }

  async update(
    id: string,
    data: UpdateHospitalEmergencyContactDto,
  ): Promise<HospitalEmergencyContact> {
    return this.prisma.hospitalEmergencyContact.update({
      where: { id },
      data: {
        ...(data.contactLevel && { contactLevel: data.contactLevel }),
        ...(data.designation && { designation: data.designation }),
        ...(data.name && { name: data.name }),
        ...(data.contactNumber && { contactNumber: data.contactNumber }),
        ...(typeof data.isActive !== 'undefined' && { isActive: data.isActive }),
      },
    });
  }

  async delete(id: string): Promise<HospitalEmergencyContact> {
    return this.prisma.hospitalEmergencyContact.delete({
      where: { id },
    });
  }
}
