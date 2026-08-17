import { ArrayMinSize, IsArray, IsOptional, IsUUID } from 'class-validator';

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
}
