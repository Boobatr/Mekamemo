import { IsUUID } from 'class-validator';

export class PreviewQuoteEmailDto {
  @IsUUID()
  vehicleId!: string;

  @IsUUID()
  garageId!: string;
}
