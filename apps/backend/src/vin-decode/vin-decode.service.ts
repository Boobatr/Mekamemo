import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DecodedVehicle {
  make: string;
  model: string;
  year: number;
  engine: string | null;
  trim: string | null;
}

interface VpicResult {
  Make: string | null;
  Model: string | null;
  ModelYear: string | null;
  Trim: string | null;
  DisplacementL: string | null;
  EngineCylinders: string | null;
  FuelTypePrimary: string | null;
  ErrorCode: string | null;
  ErrorText: string | null;
}

/**
 * Decodes a VIN via NHTSA's free vPIC API. VINs are continental (not
 * US-only), so this covers the Canadian/Quebec market fleet as well.
 */
@Injectable()
export class VinDecodeService {
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('NHTSA_VPIC_BASE_URL') ?? 'https://vpic.nhtsa.dot.gov/api';
  }

  async decode(vin: string): Promise<DecodedVehicle> {
    if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
      throw new BadRequestException('VIN invalide : 17 caractères alphanumériques attendus.');
    }

    const url = `${this.baseUrl}/vehicles/DecodeVinValuesExtended/${encodeURIComponent(vin)}?format=json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new BadRequestException("Le service de décodage VIN est momentanément indisponible.");
    }

    const body = (await response.json()) as { Results?: VpicResult[] };
    const result = body.Results?.[0];
    if (!result || !result.Make || !result.Model || !result.ModelYear) {
      throw new BadRequestException('Ce VIN n’a pas pu être décodé.');
    }

    return {
      make: titleCase(result.Make),
      model: titleCase(result.Model),
      year: parseInt(result.ModelYear, 10),
      trim: result.Trim ? titleCase(result.Trim) : null,
      engine: buildEngineLabel(result),
    };
  }
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}

function buildEngineLabel(result: VpicResult): string | null {
  const parts: string[] = [];
  if (result.DisplacementL) parts.push(`${parseFloat(result.DisplacementL).toFixed(1)} L`);
  if (result.EngineCylinders) parts.push(`I${result.EngineCylinders}`);
  return parts.length > 0 ? parts.join(' ') : null;
}
