import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { HospitalsRepository } from './repositories/hospitals.repository';
import { HospitalEmergencyContactsRepository } from './repositories/hospital-emergency-contacts.repository';
import { HospitalVisitsRepository } from './repositories/hospital-visits.repository';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { CreateHospitalEmergencyContactDto, UpdateHospitalEmergencyContactDto } from './dto/hospital-emergency-contact.dto';
import { CreateHospitalVisitDto } from './dto/hospital-visit.dto';

@Injectable()
export class HospitalsService {
  constructor(
    private readonly hospitalsRepository: HospitalsRepository,
    private readonly emergencyContactsRepository: HospitalEmergencyContactsRepository,
    private readonly hospitalVisitsRepository: HospitalVisitsRepository,
  ) {}

  async create(userId: string, data: CreateHospitalDto) {
    // Check if hospital with same license number already exists
    const existingHospital = await this.hospitalsRepository.findByLicenseNumber(
      data.licenseNumber,
    );
    if (existingHospital) {
      throw new BadRequestException('Hospital with this license number already exists');
    }

    return this.hospitalsRepository.create({ ...data, userId });
  }

  async findById(id: string) {
    const hospital = await this.hospitalsRepository.findById(id);
    if (!hospital) {
      throw new NotFoundException(`Hospital with id ${id} not found`);
    }
    return hospital;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    city?: string,
    isActive?: boolean,
    sortBy: string = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ) {
    return this.hospitalsRepository.findAll(page, limit, city, isActive, sortBy, order);
  }

  async update(id: string, data: UpdateHospitalDto) {
    const hospital = await this.hospitalsRepository.findById(id);
    if (!hospital) {
      throw new NotFoundException(`Hospital with id ${id} not found`);
    }

    // If updating license number, check uniqueness
    if (data.licenseNumber && data.licenseNumber !== hospital.licenseNumber) {
      const existingHospital = await this.hospitalsRepository.findByLicenseNumber(
        data.licenseNumber,
      );
      if (existingHospital) {
        throw new BadRequestException(
          'Hospital with this license number already exists',
        );
      }
    }

    return this.hospitalsRepository.update(id, data);
  }

  async delete(id: string) {
    const hospital = await this.hospitalsRepository.findById(id);
    if (!hospital) {
      throw new NotFoundException(`Hospital with id ${id} not found`);
    }
    return this.hospitalsRepository.delete(id);
  }

  async findByCity(city: string, isActive?: boolean) {
    return this.hospitalsRepository.findByCity(city, isActive);
  }

  async findNear(latitude: number, longitude: number, radiusKm: number = 50) {
    if (!latitude || !longitude) {
      throw new BadRequestException('Latitude and longitude are required');
    }
    return this.hospitalsRepository.findNear(latitude, longitude, radiusKm);
  }

  // Emergency Contacts
  async addEmergencyContact(hospitalId: string, data: CreateHospitalEmergencyContactDto) {
    const hospital = await this.hospitalsRepository.findById(hospitalId);
    if (!hospital) {
      throw new NotFoundException(`Hospital with id ${hospitalId} not found`);
    }
    return this.emergencyContactsRepository.create(hospitalId, data);
  }

  async getEmergencyContacts(hospitalId: string) {
    const hospital = await this.hospitalsRepository.findById(hospitalId);
    if (!hospital) {
      throw new NotFoundException(`Hospital with id ${hospitalId} not found`);
    }
    return this.emergencyContactsRepository.findByHospitalId(hospitalId);
  }

  async getEmergencyContactById(contactId: string) {
    const contact = await this.emergencyContactsRepository.findById(contactId);
    if (!contact) {
      throw new NotFoundException(`Emergency contact with id ${contactId} not found`);
    }
    return contact;
  }

  async updateEmergencyContact(contactId: string, data: UpdateHospitalEmergencyContactDto) {
    const contact = await this.emergencyContactsRepository.findById(contactId);
    if (!contact) {
      throw new NotFoundException(`Emergency contact with id ${contactId} not found`);
    }
    return this.emergencyContactsRepository.update(contactId, data);
  }

  async deleteEmergencyContact(contactId: string) {
    const contact = await this.emergencyContactsRepository.findById(contactId);
    if (!contact) {
      throw new NotFoundException(`Emergency contact with id ${contactId} not found`);
    }
    return this.emergencyContactsRepository.delete(contactId);
  }

  // Hospital Visits
  async createHospitalVisit(data: CreateHospitalVisitDto) {
    const hospital = await this.hospitalsRepository.findById(data.hospitalId);
    if (!hospital) {
      throw new NotFoundException(`Hospital with id ${data.hospitalId} not found`);
    }

    if (data.employeeId && data.dependentId) {
      throw new BadRequestException(
        'Cannot create visit for both employee and dependent simultaneously',
      );
    }

    if (!data.employeeId && !data.dependentId) {
      throw new BadRequestException(
        'Either employeeId or dependentId must be provided',
      );
    }

    return this.hospitalVisitsRepository.create(data);
  }

  async getHospitalVisits(hospitalId: string) {
    const hospital = await this.hospitalsRepository.findById(hospitalId);
    if (!hospital) {
      throw new NotFoundException(`Hospital with id ${hospitalId} not found`);
    }
    return this.hospitalVisitsRepository.findByHospitalId(hospitalId);
  }

  async getVisitById(visitId: string) {
    const visit = await this.hospitalVisitsRepository.findById(visitId);
    if (!visit) {
      throw new NotFoundException(`Hospital visit with id ${visitId} not found`);
    }
    return visit;
  }
}
