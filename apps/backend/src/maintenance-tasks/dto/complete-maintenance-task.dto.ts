import { IsDateString, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CompleteMaintenanceTaskDto {
  @IsDateString()
  performedAt!: string;

  @IsInt()
  @Min(0)
  mileageAtServiceKm!: number;

  @IsOptional()
  @IsUUID()
  garageId?: string;

  @IsInt()
  @Min(0)
  costCents!: number;
}
