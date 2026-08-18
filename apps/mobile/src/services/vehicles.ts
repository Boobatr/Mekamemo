import { apiDelete, apiGet, apiPatch, apiPost } from './api-client';

export interface Vehicle {
  id: string;
  userId: string;
  vin: string | null;
  make: string;
  model: string;
  trim: string | null;
  year: number;
  engine: string | null;
  usageType: 'city' | 'highway' | 'mixed';
  photoUrl: string | null;
  scheduleSource: string | null;
  scheduleGeneratedAt: string | null;
  latestOdometerKm: number | null;
  createdAt: string;
}

export interface CreateVehicleInput {
  vin?: string;
  make: string;
  model: string;
  trim?: string;
  year: number;
  engine?: string;
  usageType: 'city' | 'highway' | 'mixed';
  odometerKm: number;
}

export function listVehicles(): Promise<Vehicle[]> {
  return apiGet('/vehicles');
}

export function getVehicle(id: string): Promise<Vehicle> {
  return apiGet(`/vehicles/${id}`);
}

export function createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
  return apiPost('/vehicles', input);
}

export function updateVehicle(id: string, input: { usageType?: string; photoUrl?: string }): Promise<Vehicle> {
  return apiPatch(`/vehicles/${id}`, input);
}

export function deleteVehicle(id: string): Promise<void> {
  return apiDelete(`/vehicles/${id}`);
}

export interface DecodedVehicle {
  make: string;
  model: string;
  year: number;
  engine: string | null;
  trim: string | null;
}

export function decodeVin(vin: string): Promise<DecodedVehicle> {
  return apiPost('/vin-decode', { vin });
}
