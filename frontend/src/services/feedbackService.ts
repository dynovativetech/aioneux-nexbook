import api from './api';
import type { ApiResponse } from '../types';

export type FeedbackTargetType = 'Venue' | 'Facility';

export interface FeedbackDto {
  id: number;
  targetType: string;
  targetId: number;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export const feedbackService = {
  list: async (targetType: FeedbackTargetType, targetId: number): Promise<FeedbackDto[]> => {
    const res = await api.get<ApiResponse<FeedbackDto[]>>('/feedback', { params: { targetType, targetId } });
    if (!res.data.success) throw new Error(res.data.message || 'Failed to load feedback');
    return res.data.data ?? [];
  },

  upsert: async (payload: { targetType: FeedbackTargetType; targetId: number; rating: number; comment?: string }): Promise<void> => {
    const res = await api.post<ApiResponse<string>>('/feedback', payload);
    if (!res.data.success) throw new Error(res.data.message || 'Failed to save feedback');
  },
};

