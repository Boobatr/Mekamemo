export const ODOMETER_OCR_PROVIDER = 'ODOMETER_OCR_PROVIDER';

export interface OdometerOcrProvider {
  /** Returns the odometer reading in km, or null if it could not be read. */
  read(imageBuffer: Buffer, mimeType: string): Promise<number | null>;
}
