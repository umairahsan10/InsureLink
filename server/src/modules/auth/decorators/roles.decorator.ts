import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard';

export function Roles(...roles: string[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(RolesGuard),
  );
}


