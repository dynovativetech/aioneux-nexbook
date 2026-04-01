import api from './api';
import type { ApiResponse } from '../types';

export interface AdminAnnouncementListItem {
  id: number;
  title: string;
  isPublished: boolean;
  publishAt?: string;
  areaId?: number;
  areaName?: string;
  communityId?: number;
  communityName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAnnouncementDetail extends AdminAnnouncementListItem {
  body: string;
}

export interface UpsertAnnouncementPayload {
  title: string;
  body: string;
  isPublished: boolean;
  publishAt?: string;
  areaId?: number;
  communityId?: number;
}

export interface AnnouncementAnalyticsRow {
  announcementId: number;
  title: string;
  isPublished: boolean;
  publishAt?: string;
  totalViews: number;
  uniqueViewers: number;
  createdAt: string;
}

export const announcementService = {
  list: () => api.get<AdminAnnouncementListItem[]>('/admin/announcements').then((r) => r.data),

  get: (id: number) => api.get<AdminAnnouncementDetail>(`/admin/announcements/${id}`).then((r) => r.data),

  create: async (payload: UpsertAnnouncementPayload): Promise<number> => {
    const res = await api.post<ApiResponse<number>>('/admin/announcements', payload);
    if (!res.data.success || res.data.data == null) throw new Error(res.data.message || 'Create failed');
    return res.data.data;
  },

  update: async (id: number, payload: UpsertAnnouncementPayload): Promise<void> => {
    const res = await api.put<ApiResponse<string>>(`/admin/announcements/${id}`, payload);
    if (!res.data.success) throw new Error(res.data.message || 'Update failed');
  },

  remove: async (id: number): Promise<void> => {
    const res = await api.delete<ApiResponse<string>>(`/admin/announcements/${id}`);
    if (!res.data.success) throw new Error(res.data.message || 'Delete failed');
  },

  analytics: async (): Promise<AnnouncementAnalyticsRow[]> => {
    const res = await api.get<ApiResponse<AnnouncementAnalyticsRow[]>>('/admin/analytics/announcements');
    if (!res.data.success) throw new Error(res.data.message || 'Analytics failed');
    return res.data.data ?? [];
  },
};

