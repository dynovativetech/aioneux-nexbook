import api from './api';
import type { ApiResponse } from '../types';

export interface CommunityRulesDocument {
  id: number;
  areaId?: number;
  areaName?: string;
  communityId?: number;
  communityName?: string;
  html: string;
  updatedAt: string;
}

export interface UpsertCommunityRulesDocumentPayload {
  areaId?: number;
  communityId?: number;
  html: string;
}

export const rulesDocumentService = {
  getAdmin: async (): Promise<CommunityRulesDocument | null> => {
    const res = await api.get<ApiResponse<CommunityRulesDocument | null>>('/admin/rules-document');
    if (!res.data.success) throw new Error(res.data.message || 'Failed to load rules document');
    return res.data.data ?? null;
  },

  upsertAdmin: async (payload: UpsertCommunityRulesDocumentPayload): Promise<number> => {
    const res = await api.put<ApiResponse<number>>('/admin/rules-document', payload);
    if (!res.data.success || res.data.data == null) throw new Error(res.data.message || 'Failed to save rules');
    return res.data.data;
  },

  getForMember: async (): Promise<CommunityRulesDocument | null> => {
    const res = await api.get<ApiResponse<CommunityRulesDocument | null>>('/community/rules-document');
    if (!res.data.success) throw new Error(res.data.message || 'Failed to load rules');
    return res.data.data ?? null;
  },
};

