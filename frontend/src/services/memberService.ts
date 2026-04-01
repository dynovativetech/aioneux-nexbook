import api from './api';
import type { ApiResponse } from '../types';

export interface AdminMember {
  id: number;
  fullName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string; // mobile
  landlinePhone?: string;
  city?: string;
  countryName?: string;
  areaId?: number;
  areaName?: string;
  communityId?: number;
  communityName?: string;
  isActive: boolean;
}

export interface AdminMemberDetail extends AdminMember {
  apartmentOrVillaNumber?: string;
  streetAddress?: string;
  state?: string;
  emirate?: string;
  postalCode?: string;
}

export interface CreateMemberPayload {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  landlinePhone?: string;
  apartmentOrVillaNumber?: string;
  streetAddress: string;
  city: string;
  state: string;
  countryName: string;
  emirate?: string;
  postalCode?: string;
  areaId: number;
  communityId: number;
}

export interface UpdateMemberPayload extends CreateMemberPayload {
  isActive: boolean;
}

export interface CreateMemberResult {
  userId: number;
  email: string;
  fullName: string;
  tempPassword: string;
}

export const memberService = {
  list: () => api.get<AdminMember[]>('/admin/members').then((r) => r.data),

  get: (id: number) =>
    api.get<AdminMemberDetail>(`/admin/members/${id}`).then((r) => r.data),

  create: async (payload: CreateMemberPayload): Promise<CreateMemberResult> => {
    const r = await api.post<ApiResponse<CreateMemberResult>>('/admin/members', payload);
    if (!r.data.success || !r.data.data) throw new Error(r.data.message || 'Create failed');
    return r.data.data;
  },

  update: async (id: number, payload: UpdateMemberPayload): Promise<void> => {
    const r = await api.put<ApiResponse<string>>(`/admin/members/${id}`, payload);
    if (!r.data.success) throw new Error(r.data.message || 'Update failed');
  },

  remove: async (id: number): Promise<void> => {
    const r = await api.delete<ApiResponse<string>>(`/admin/members/${id}`);
    if (!r.data.success) throw new Error(r.data.message || 'Deactivate failed');
  },

  resetPassword: async (id: number): Promise<{ userId: number; tempPassword: string }> => {
    const r = await api.post<ApiResponse<{ userId: number; tempPassword: string }>>(
      `/admin/members/${id}/reset-password`,
    );
    if (!r.data.success || !r.data.data) throw new Error(r.data.message || 'Reset failed');
    return r.data.data;
  },
};
