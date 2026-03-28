import { CorporateStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateCorporateStatusDto {
  @IsEnum(CorporateStatus)
  status: CorporateStatus;
}
