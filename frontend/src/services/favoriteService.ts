import api from './api';
import type { ApiResponse } from '../types';

export type FavoriteTargetType = 'Venue' | 'Facility';

export interface FavoriteDto {
  id: number;
  targetType: FavoriteTargetType | string;
  targetId: number;
  createdAt: string;
  name?: string;
}

export const favoriteService = {
  list: async (): Promise<FavoriteDto[]> => {
    const res = await api.get<ApiResponse<FavoriteDto[]>>('/favorites');
    if (!res.data.success) throw new Error(res.data.message || 'Failed to load favorites');
    return res.data.data ?? [];
  },

  add: async (targetType: FavoriteTargetType, targetId: number): Promise<void> => {
    const res = await api.post<ApiResponse<string>>('/favorites', { targetType, targetId });
    if (!res.data.success) throw new Error(res.data.message || 'Failed to add favorite');
  },

  remove: async (targetType: FavoriteTargetType, targetId: number): Promise<void> => {
    const res = await api.delete<ApiResponse<string>>('/favorites', { params: { targetType, targetId } });
    if (!res.data.success) throw new Error(res.data.message || 'Failed to remove favorite');
  },
};

