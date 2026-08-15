import { IsIn, IsInt, IsOptional, IsString, Length, Min, MinLength } from 'class-validator';

export class CreateVehicleDto {
  @IsOptional()
  @IsString()
  @Length(17, 17)
  vin?: string;

  @IsString()
  @MinLength(1)
  make!: string;

  @IsString()
  @MinLength(1)
  model!: string;

  @IsOptional()
  @IsString()
  trim?: string;

  @IsInt()
  @Min(1980)
  year!: number;

  @IsOptional()
  @IsString()
  engine?: string;

  @IsIn(['city', 'highway', 'mixed'])
  usageType!: 'city' | 'highway' | 'mixed';

  @IsInt()
  @Min(0)
  odometerKm!: number;
}
