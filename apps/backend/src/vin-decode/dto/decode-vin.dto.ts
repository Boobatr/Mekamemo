import { Length } from 'class-validator';

export class DecodeVinDto {
  @Length(17, 17)
  vin!: string;
}
