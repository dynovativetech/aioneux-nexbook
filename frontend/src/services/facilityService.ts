import api from './api';
import type { Facility, ApiResponse } from '../types';

export interface FacilityOperatingHours {
  id: number;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface SlotConfigPayload {
  slotDurationMinutes: number;
  maxConsecutiveSlots: number;
}

type FacilityPayload = Pick<Facility, 'name' | 'location' | 'capacity'> &
  Partial<Omit<Facility, 'id' | 'name' | 'location' | 'capacity'>>;

export const facilityService = {
  // Backend returns raw Facility[] (not wrapped in ApiResponse)
  getAll: (params?: { venueId?: number; activeOnly?: boolean }) =>
    api.get<Facility[]>('/facilities', { params }).then(r => Array.isArray(r.data) ? r.data : []),

  getById: (id: number) =>
    api.get<Facility>(`/facilities/${id}`).then(r => r.data),

  create: (data: FacilityPayload) =>
    api.post<ApiResponse<Facility>>('/facilities', data).then(r => r.data.data!),

  update: (id: number, data: FacilityPayload & { id: number }) =>
    api.put<void>(`/facilities/${id}`, data),

  remove: (id: number) =>
    api.delete<void>(`/facilities/${id}`),

  // ── Activities ────────────────────────────────────────────────────────────────

  linkActivity: (id: number, activityId: number) =>
    api.post(`/facilities/${id}/activities`, { activityId }).then(r => r.data),

  unlinkActivity: (id: number, activityId: number) =>
    api.delete(`/facilities/${id}/activities/${activityId}`),

  // ── Operating Hours ───────────────────────────────────────────────────────────

  getHours: (id: number) =>
    api.get<ApiResponse<FacilityOperatingHours[]>>(`/facilities/${id}/hours`)
      .then(r => r.data.data ?? []),

  setHours: (id: number, hours: FacilityOperatingHours[]) =>
    api.put(`/facilities/${id}/hours`, { hours }).then(r => r.data),

  // ── Slot Configuration ────────────────────────────────────────────────────────

  setSlotConfig: (id: number, payload: SlotConfigPayload) =>
    api.put(`/facilities/${id}/slot-config`, payload).then(r => r.data),
};
