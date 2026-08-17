import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

class ParsedSlotInput {
  @IsString()
  startsAt!: string;

  @IsOptional()
  @IsNumber()
  priceCents?: number;
}

export class RecordGarageResponseDto {
  @IsUUID()
  quoteRequestGarageId!: string;

  @IsString()
  rawContent!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParsedSlotInput)
  parsedSlots!: ParsedSlotInput[];

  @IsOptional()
  @IsNumber()
  priceCents?: number;

  @IsIn(['email', 'voice_transcript'])
  channel!: 'email' | 'voice_transcript';
}
