import api from './api';
import type { Activity } from '../types';

type ActivityPayload = Pick<Activity, 'name' | 'durationMinutes'> & Partial<Omit<Activity, 'id' | 'name' | 'durationMinutes'>>;

export const activityService = {
  getAll: () => api.get<Activity[]>('/activities').then((r) => r.data),
  getById: (id: number) => api.get<Activity>(`/activities/${id}`).then((r) => r.data),
  create: (data: ActivityPayload) => api.post<Activity>('/activities', data).then((r) => r.data),
  update: (id: number, data: ActivityPayload & { id: number }) => api.put<void>(`/activities/${id}`, data),
  remove: (id: number) => api.delete<void>(`/activities/${id}`),
};
