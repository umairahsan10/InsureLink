import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUserDto } from '../../auth/dto/current-user.dto';
import { UsersService } from '../users.service';

describe('UsersService', () => {
  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const actorCorporate: CurrentUserDto = {
    id: 'actor-1',
    email: 'actor@corp.com',
    role: UserRole.corporate,
  };

  const actorPatient: CurrentUserDto = {
    id: 'patient-1',
    email: 'patient@demo.com',
    role: UserRole.patient,
  };

  const sampleUser = {
    id: 'user-1',
    email: 'user@example.com',
    firstName: 'Ali',
    lastName: 'Raza',
    phone: '03001234567',
    userRole: UserRole.patient,
    dob: null,
    gender: null,
    cnic: null,
    address: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
    passwordHash: 'hidden',
  };

  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(prismaMock as never);
  });

  it('returns user by id for elevated role', async () => {
    prismaMock.user.findUnique.mockResolvedValue(sampleUser);

    const result = await service.getUserById(sampleUser.id, actorCorporate);

    expect(result.id).toBe(sampleUser.id);
    expect((result as unknown as { passwordHash?: string }).passwordHash).toBeUndefined();
  });

  it('blocks non-elevated user from reading other user', async () => {
    await expect(service.getUserById('another-user', actorPatient)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('updates own profile for patient', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: actorPatient.id });
    prismaMock.user.update.mockResolvedValue({
      ...sampleUser,
      id: actorPatient.id,
      firstName: 'Updated',
    });

    const result = await service.updateUser(
      actorPatient.id,
      { firstName: 'Updated' },
      actorPatient,
    );

    expect(result.firstName).toBe('Updated');
  });

  it('lists users for elevated role', async () => {
    prismaMock.$transaction.mockResolvedValue([[sampleUser], 1]);

    const result = await service.listUsers({ page: 1, limit: 20 }, actorCorporate);

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it('rejects list users for non-elevated role', async () => {
    await expect(service.listUsers({ page: 1, limit: 20 }, actorPatient)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('deletes user for elevated role', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'target-user' });
    prismaMock.user.delete.mockResolvedValue({ id: 'target-user' });

    const result = await service.deleteUser('target-user', actorCorporate);

    expect(result.success).toBe(true);
  });

  it('throws not found when deleting missing user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(service.deleteUser('missing-user', actorCorporate)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updates role for elevated actor', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'target-user' });
    prismaMock.user.update.mockResolvedValue({
      ...sampleUser,
      id: 'target-user',
      userRole: UserRole.hospital,
    });

    const result = await service.updateUserRole(
      'target-user',
      { role: UserRole.hospital },
      actorCorporate,
    );

    expect(result.userRole).toBe(UserRole.hospital);
  });
});
