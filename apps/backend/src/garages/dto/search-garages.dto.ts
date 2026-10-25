import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class SearchGaragesDto {
  @IsString()
  @MinLength(1)
  query!: string;

  /** The user's current position (browser location), used instead of their postal code. Both or neither. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;
}
