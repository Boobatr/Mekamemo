import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateHistoryEntryDto {
  @IsString()
  @MinLength(1)
  taskName!: string;

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
