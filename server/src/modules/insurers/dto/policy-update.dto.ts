import { IsString, IsNotEmpty } from 'class-validator';

export class PolicyUpdateDto {
  @IsString()
  @IsNotEmpty()
  policyName: string;
}
