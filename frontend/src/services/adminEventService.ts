import api from './api';
import type { ApiResponse } from '../types';

export interface AdminEventListItem {
  id: number;
  title: string;
  isPublished: boolean;
  startsAt: string;
  endsAt?: string;
  locationText?: string;
  mainImageUrl?: string;
  addressText?: string;
  contactPersonName?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  communityId?: number;
  communityName?: string;
  areaId?: number;
  areaName?: string;
  rsvpGoingCount: number;
  rsvpMaybeCount: number;
  rsvpNotGoingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminEventDetail extends AdminEventListItem {
  description: string;
}

export interface UpsertEventPayload {
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  locationText?: string;
  addressText?: string;
  contactPersonName?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  isPublished: boolean;
  areaId?: number;
  communityId?: number;
}

export const adminEventService = {
  list: () => api.get<AdminEventListItem[]>('/admin/events').then((r) => r.data),

  get: (id: number) => api.get<AdminEventDetail>(`/admin/events/${id}`).then((r) => r.data),

  create: async (payload: UpsertEventPayload): Promise<number> => {
    const res = await api.post<ApiResponse<number>>('/admin/events', payload);
    if (!res.data.success || res.data.data == null) throw new Error(res.data.message || 'Create failed');
    return res.data.data;
  },

  update: async (id: number, payload: UpsertEventPayload): Promise<void> => {
    const res = await api.put<ApiResponse<string>>(`/admin/events/${id}`, payload);
    if (!res.data.success) throw new Error(res.data.message || 'Update failed');
  },

  remove: async (id: number): Promise<void> => {
    const res = await api.delete<ApiResponse<string>>(`/admin/events/${id}`);
    if (!res.data.success) throw new Error(res.data.message || 'Delete failed');
  },
};

