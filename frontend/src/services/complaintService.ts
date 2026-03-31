import api from './api';
import type { ApiResponse, Complaint, ComplaintComment, CreateComplaintRequest } from '../types';

export const complaintService = {
  getAll: () =>
    api.get<ApiResponse<Complaint[]>>('/complaints').then((r) => r.data),

  getByUser: (userId: number) =>
    api.get<ApiResponse<Complaint[]>>(`/complaints/user/${userId}`).then((r) => r.data),

  getById: (id: number) =>
    api.get<ApiResponse<Complaint>>(`/complaints/${id}`).then((r) => r.data),

  /** Create a complaint. Images are optional; uses multipart/form-data. */
  create: (data: CreateComplaintRequest, images?: File[]) => {
    const form = new FormData();
    form.append('userId', String(data.userId));
    form.append('title', data.title);
    form.append('description', data.description);
    if (data.bookingId)  form.append('bookingId',  String(data.bookingId));
    if (data.categoryId) form.append('categoryId', String(data.categoryId));
    if (data.category)   form.append('category',   data.category);
    if (images) images.forEach((f) => form.append('images', f));

    return api.post<ApiResponse<Complaint>>('/complaints', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  updateStatus: (id: number, status: string, adminNote?: string, adminId?: number) =>
    api.patch<ApiResponse<Complaint>>(`/complaints/${id}/status`, { status, adminNote, adminId })
       .then((r) => r.data),

  /** Add a comment, optionally with an image attachment. */
  addComment: (complaintId: number, authorId: number, text: string, isAdminComment = false, image?: File) => {
    const form = new FormData();
    form.append('authorId',       String(authorId));
    form.append('text',           text);
    form.append('isAdminComment', String(isAdminComment));
    if (image) form.append('image', image);

    return api.post<ApiResponse<ComplaintComment>>(`/complaints/${complaintId}/comments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};
