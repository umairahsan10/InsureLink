import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
  ValidateNested,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MessageType } from '@prisma/client';

export class InlineAttachmentDto {
  @IsString()
  filename: string;

  @IsString()
  filePath: string;

  @IsString()
  fileUrl: string;

  @IsNumber()
  @Min(0)
  fileSizeBytes: number;
}

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  messageText: string;

  @IsOptional()
  @IsUUID()
  receiverId?: string;

  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType = MessageType.text;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  attachmentIds?: string[];

  /** Inline attachment metadata (uploaded files passed directly from the client) */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InlineAttachmentDto)
  attachments?: InlineAttachmentDto[];
}
