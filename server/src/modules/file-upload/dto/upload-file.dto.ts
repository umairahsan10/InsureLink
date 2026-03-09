import { IsOptional, IsString, IsIn } from 'class-validator';

export class UploadFileDto {
  @IsOptional()
  @IsString()
  @IsIn(['chat-attachments', 'general'])
  folder?: string = 'chat-attachments';
}
