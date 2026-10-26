import { ArrayMinSize, IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateQuoteRequestDto {
  @IsUUID()
  vehicleId!: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @IsUUID()
  diagnosisId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  garageIds!: string[];

  /** The email subject as the user edited it. Left out: the standard one. */
  @IsOptional()
  @IsString()
  @MaxLength(150)
  subject?: string;

  /** The message as the user edited it, sent as is to every garage. Left out: the standard one. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
