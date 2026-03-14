import {
  IsArray,
  IsUUID,
  ArrayMinSize,
  IsOptional,
  IsString,
} from 'class-validator';

export class BulkApproveClaimDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  claimIds: string[];

  @IsOptional()
  @IsString()
  eventNote?: string;
}
