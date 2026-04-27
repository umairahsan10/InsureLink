import { IsArray, ArrayMinSize, IsUUID } from 'class-validator';

export class BulkActionDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  userIds: string[];
}
