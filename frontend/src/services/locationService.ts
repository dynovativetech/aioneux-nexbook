import api from './api';
import type { Country, City, Area, Community, Venue, ApiResponse } from '../types';

// ── Countries ─────────────────────────────────────────────────────────────────

export async function getCountries(): Promise<Country[]> {
  const res = await api.get<ApiResponse<Country[]>>('/location/countries');
  return res.data.data ?? [];
}

export async function createCountry(name: string, code: string): Promise<Country> {
  const res = await api.post<ApiResponse<Country>>('/location/countries', { name, code });
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data!;
}

// ── Cities ────────────────────────────────────────────────────────────────────

export async function getCities(countryId: number): Promise<City[]> {
  const res = await api.get<ApiResponse<City[]>>('/location/cities', { params: { countryId } });
  return res.data.data ?? [];
}

export async function createCity(countryId: number, name: string): Promise<City> {
  const res = await api.post<ApiResponse<City>>('/location/cities', { countryId, name });
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data!;
}

// ── Areas ─────────────────────────────────────────────────────────────────────

export async function getAreas(cityId: number): Promise<Area[]> {
  const res = await api.get<ApiResponse<Area[]>>('/location/areas', { params: { cityId } });
  return res.data.data ?? [];
}

export async function createArea(cityId: number, name: string): Promise<Area> {
  const res = await api.post<ApiResponse<Area>>('/location/areas', { cityId, name });
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data!;
}

// ── Communities ───────────────────────────────────────────────────────────────

export async function getCommunities(areaId?: number): Promise<Community[]> {
  const params = areaId ? { areaId } : {};
  const res = await api.get<ApiResponse<Community[]>>('/location/communities', { params });
  return res.data.data ?? [];
}

export async function createCommunity(areaId: number, name: string, description?: string): Promise<Community> {
  const res = await api.post<ApiResponse<Community>>('/location/communities', { areaId, name, description });
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data!;
}

export async function updateCommunity(id: number, name: string, description?: string): Promise<void> {
  await api.put(`/location/communities/${id}`, { name, description });
}

export async function deleteCommunity(id: number): Promise<void> {
  await api.delete(`/location/communities/${id}`);
}

// Named object export for convenience
export const locationService = {
  getCountries,
  getCities,
  getAreas,
  getCommunities,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  getVenues,
  createVenue,
};

// ── Venues ────────────────────────────────────────────────────────────────────

export async function getVenues(communityId: number): Promise<Venue[]> {
  const res = await api.get<ApiResponse<Venue[]>>('/location/venues', { params: { communityId } });
  return res.data.data ?? [];
}

export async function createVenue(
  communityId: number,
  name: string,
  address: string,
  options?: { latitude?: number; longitude?: number; contactEmail?: string }
): Promise<Venue> {
  const res = await api.post<ApiResponse<Venue>>('/location/venues', {
    communityId, name, address, ...options,
  });
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data!;
}
