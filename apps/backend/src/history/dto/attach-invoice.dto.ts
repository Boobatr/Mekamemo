import { IsString, MinLength } from 'class-validator';

export class AttachInvoiceDto {
  @IsString()
  @MinLength(1)
  fileUrl!: string;
}
