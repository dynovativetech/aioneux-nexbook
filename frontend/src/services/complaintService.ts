import api from './api';
import type { ApiResponse, Complaint, ComplaintComment, CreateComplaintRequest } from '../types';

export const complaintService = {
  getAll: () =>
    api.get<ApiResponse<Complaint[]>>('/complaints').then((r) => r.data),

  getByUser: (userId: number) =>
    api.get<ApiResponse<Complaint[]>>(`/complaints/user/${userId}`).then((r) => r.data),

  getById: (id: number) =>
    api.get<ApiResponse<Complaint>>(`/complaints/${id}`).then((r) => r.data),

  create: (data: CreateComplaintRequest) =>
    api.post<ApiResponse<Complaint>>('/complaints', data).then((r) => r.data),

  updateStatus: (id: number, status: string, adminNote?: string) =>
    api
      .patch<ApiResponse<Complaint>>(`/complaints/${id}/status`, { status, adminNote })
      .then((r) => r.data),

  addComment: (complaintId: number, authorId: number, text: string) =>
    api
      .post<ApiResponse<ComplaintComment>>(`/complaints/${complaintId}/comments`, { authorId, text })
      .then((r) => r.data),
};
