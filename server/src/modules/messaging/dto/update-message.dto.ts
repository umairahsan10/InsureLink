import { IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  messageText: string;
}
