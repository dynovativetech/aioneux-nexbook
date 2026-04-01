import api from './api';
import type { ApiResponse } from '../types';

export interface MemberAnnouncement {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  isViewed: boolean;
  areaId?: number;
  communityId?: number;
}

export interface MemberRule {
  id: number;
  title: string;
  body: string;
  sortOrder: number;
}

export type RsvpStatus = 'Going' | 'Maybe' | 'NotGoing';

export interface MemberEvent {
  id: number;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  locationText?: string;
  mainImageUrl?: string;
  addressText?: string;
  contactPersonName?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  myRsvpStatus: string;
  goingCount: number;
  maybeCount: number;
  communityName?: string;
  areaName?: string;
}

export const communityService = {
  listAnnouncements: async (): Promise<MemberAnnouncement[]> => {
    const res = await api.get<ApiResponse<MemberAnnouncement[]>>('/community/announcements');
    if (!res.data.success) throw new Error(res.data.message || 'Failed to load announcements');
    return res.data.data ?? [];
  },

  markViewed: async (id: number): Promise<void> => {
    const res = await api.post<ApiResponse<string>>(`/community/announcements/${id}/view`, {});
    if (!res.data.success) throw new Error(res.data.message || 'Failed to mark viewed');
  },

  listRules: async (): Promise<MemberRule[]> => {
    const res = await api.get<ApiResponse<MemberRule[]>>('/community/rules');
    if (!res.data.success) throw new Error(res.data.message || 'Failed to load rules');
    return res.data.data ?? [];
  },

  listEvents: async (): Promise<MemberEvent[]> => {
    const res = await api.get<ApiResponse<MemberEvent[]>>('/community/events');
    if (!res.data.success) throw new Error(res.data.message || 'Failed to load events');
    return res.data.data ?? [];
  },

  rsvp: async (id: number, status: RsvpStatus): Promise<void> => {
    const res = await api.post<ApiResponse<string>>(`/community/events/${id}/rsvp`, { status });
    if (!res.data.success) throw new Error(res.data.message || 'Failed to RSVP');
  },
};

