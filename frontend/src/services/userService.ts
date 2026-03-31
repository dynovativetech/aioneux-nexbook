import api from './api';
import type { ApiResponse, UserProfileDto, UpdateProfileRequest } from '../types';

export const userService = {
  getProfile: (userId: number) =>
    api.get<ApiResponse<UserProfileDto>>(`/auth/profile/${userId}`)
      .then((r) => r.data),

  updateProfile: (req: UpdateProfileRequest) =>
    api.put<ApiResponse<UserProfileDto>>('/auth/profile', req)
      .then((r) => r.data),

  changePassword: (userId: number, currentPassword: string, newPassword: string) =>
    api.post<ApiResponse<boolean>>('/auth/change-password', { userId, currentPassword, newPassword })
      .then((r) => r.data),

  /** Member portal users (Customer role) in the current tenant — for admin dashboard. */
  getMemberCount: () =>
    api.get<{ count: number }>('/users/member-count').then((r) => r.data.count),
};
