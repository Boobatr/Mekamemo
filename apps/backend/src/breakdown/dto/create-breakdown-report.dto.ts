import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';

class AttachmentInput {
  @IsIn(['photo', 'video', 'audio'])
  type!: 'photo' | 'video' | 'audio';

  @IsString()
  url!: string;
}

export class CreateBreakdownReportDto {
  @IsUUID()
  vehicleId!: string;

  @IsString()
  @MinLength(1)
  descriptionText!: string;

  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @IsBoolean()
  urgent!: boolean;

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => AttachmentInput)
  attachments!: AttachmentInput[];
}
