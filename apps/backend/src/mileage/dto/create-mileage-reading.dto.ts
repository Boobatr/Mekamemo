import { IsDateString, IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class CreateMileageReadingDto {
  @IsInt()
  @Min(0)
  valueKm!: number;

  @IsIn(['manual', 'ocr', 'estimate_tap', 'gps'])
  source!: 'manual' | 'ocr' | 'estimate_tap' | 'gps';

  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}
