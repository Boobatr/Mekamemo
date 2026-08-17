import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateMaintenanceTaskDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  intervalKm?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  intervalMonths?: number;

  @IsOptional()
  @IsIn(['low', 'normal', 'critical'])
  priority?: 'low' | 'normal' | 'critical';

  @IsOptional()
  @IsString()
  notesForGarage?: string;

  @IsOptional()
  @IsBoolean()
  groupWithTireRotation?: boolean;

  @IsOptional()
  @IsUUID()
  groupWithTaskId?: string;
}
