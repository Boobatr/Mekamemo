import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

/** A garage the app doesn't list yet, typed in by a user. */
export class AddGarageDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  /** Civic number and street, e.g. "485 Avenue Royale". */
  @IsString()
  @Length(3, 200)
  street!: string;

  @IsString()
  @Length(2, 100)
  city!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/, { message: 'postalCode must look like G0A 3X0' })
  postalCode?: string;

  @IsOptional()
  @IsString()
  @Length(7, 25)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
