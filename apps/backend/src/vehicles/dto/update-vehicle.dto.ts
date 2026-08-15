import { IsIn, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateVehicleDto {
  @IsOptional()
  @IsIn(['city', 'highway', 'mixed'])
  usageType?: 'city' | 'highway' | 'mixed';

  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  photoUrl?: string;
}
