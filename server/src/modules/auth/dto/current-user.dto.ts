import { UserRole } from '@prisma/client';

export class CurrentUserDto {
  id: string;
  email: string;
  role: UserRole;
  organizationId?: string;
}
