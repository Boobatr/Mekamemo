import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { VinDecodeService } from './vin-decode.service';

function mockFetchOnce(response: unknown, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: async () => response,
  }) as unknown as typeof fetch;
}

describe('VinDecodeService', () => {
  let service: VinDecodeService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [VinDecodeService],
    }).compile();
    service = moduleRef.get(VinDecodeService);
  });

  const VALID_VIN = '2T3W1RFV8MW123456';

  it('rejects a VIN that is not 17 alphanumeric characters', async () => {
    await expect(service.decode('TOO-SHORT')).rejects.toThrow(BadRequestException);
  });

  it('rejects VINs containing the excluded letters I, O, Q', async () => {
    await expect(service.decode('2T3W1RFV8MWI23456')).rejects.toThrow(BadRequestException);
  });

  it('decodes a successful vPIC response into make/model/year/engine', async () => {
    mockFetchOnce({
      Results: [
        {
          Make: 'TOYOTA',
          Model: 'RAV4',
          ModelYear: '2021',
          Trim: 'LE',
          DisplacementL: '2.5',
          EngineCylinders: '4',
          FuelTypePrimary: 'Gasoline',
          ErrorCode: '0',
          ErrorText: null,
        },
      ],
    });

    const result = await service.decode(VALID_VIN);
    expect(result).toEqual({
      make: 'Toyota',
      model: 'Rav4',
      year: 2021,
      trim: 'Le',
      engine: '2.5 L I4',
    });
  });

  it('throws when vPIC returns no usable result (e.g. unrecognized VIN)', async () => {
    mockFetchOnce({ Results: [{ Make: null, Model: null, ModelYear: null }] });
    await expect(service.decode(VALID_VIN)).rejects.toThrow(BadRequestException);
  });

  it('throws when the vPIC service itself is unavailable', async () => {
    mockFetchOnce({}, false);
    await expect(service.decode(VALID_VIN)).rejects.toThrow(BadRequestException);
  });
});
