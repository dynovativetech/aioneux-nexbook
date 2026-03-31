import api from './api';
import type { ApiResponse, ComplaintCategory } from '../types';

export const FALLBACK_CATEGORIES: ComplaintCategory[] = [
  { id: 1, name: 'Facility Issue' },
  { id: 2, name: 'Booking Issue' },
  { id: 3, name: 'Payment' },
  { id: 4, name: 'Technical' },
  { id: 5, name: 'General' },
  { id: 6, name: 'Other' },
];

export const complaintCategoryService = {
  getAll: () =>
    api.get<ApiResponse<ComplaintCategory[]>>('/complaint-categories')
      .then((r) => r.data),

  create: (name: string) =>
    api.post<ApiResponse<ComplaintCategory>>('/complaint-categories', { name })
      .then((r) => r.data),

  update: (id: number, name: string) =>
    api.put<ApiResponse<ComplaintCategory>>(`/complaint-categories/${id}`, { name })
      .then((r) => r.data),

  delete: (id: number) =>
    api.delete<ApiResponse<boolean>>(`/complaint-categories/${id}`)
      .then((r) => r.data),
};
