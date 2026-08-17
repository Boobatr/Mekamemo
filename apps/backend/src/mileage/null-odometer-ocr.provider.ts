import { Injectable } from '@nestjs/common';
import { OdometerOcrProvider } from './odometer-ocr-provider.interface';

/** Used when no ANTHROPIC_API_KEY is configured — the user falls back to manual entry. */
@Injectable()
export class NullOdometerOcrProvider implements OdometerOcrProvider {
  async read(): Promise<number | null> {
    return null;
  }
}
