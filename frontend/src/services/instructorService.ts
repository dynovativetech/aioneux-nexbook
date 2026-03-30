import api from './api';
import type { Instructor } from '../types';

type InstructorPayload = Pick<Instructor, 'name' | 'expertise' | 'experienceYears'> & Partial<Omit<Instructor, 'id' | 'name' | 'expertise' | 'experienceYears'>>;

export const instructorService = {
  getAll: () => api.get<Instructor[]>('/instructors').then((r) => r.data),
  getById: (id: number) => api.get<Instructor>(`/instructors/${id}`).then((r) => r.data),
  create: (data: InstructorPayload) => api.post<Instructor>('/instructors', data).then((r) => r.data),
  update: (id: number, data: InstructorPayload & { id: number }) => api.put<void>(`/instructors/${id}`, data),
  remove: (id: number) => api.delete<void>(`/instructors/${id}`),
};
