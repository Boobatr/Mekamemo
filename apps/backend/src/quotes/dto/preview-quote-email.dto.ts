import { IsOptional, IsUUID } from 'class-validator';

export class PreviewQuoteEmailDto {
  @IsUUID()
  vehicleId!: string;

  @IsUUID()
  garageId!: string;

  /** The maintenance item the request is about: it goes into the message. */
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @IsUUID()
  diagnosisId?: string;
}
