import { IsOptional, IsString, MinLength } from 'class-validator';

export class SearchGaragesDto {
  @IsString()
  @MinLength(1)
  query!: string;
}
