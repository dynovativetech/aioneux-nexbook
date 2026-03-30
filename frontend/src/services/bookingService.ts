import api from './api';
import type {
  ApiResponse,
  Booking,
  CreateBookingRequest,
  CreateGroupBookingRequest,
  CreateMultiSlotBookingRequest,
  UpdateBookingRequest,
  ResourceAvailabilityResponse,
} from '../types';

export const bookingService = {
  // ── Queries ────────────────────────────────────────────────────────────────
  getAll: () =>
    api.get<ApiResponse<Booking[]>>('/bookings')
      .then((r) => r.data.data ?? (r.data as unknown as Booking[])),

  getById: (id: number) =>
    api.get<ApiResponse<Booking>>(`/bookings/${id}`).then((r) => r.data.data),

  // ── Advanced creation (new engine) ────────────────────────────────────────
  /** POST /api/bookings/single — single person, single slot. */
  createSingle: (data: CreateBookingRequest) =>
    api.post<ApiResponse<Booking>>('/bookings/single', data).then((r) => r.data),

  /** POST /api/bookings/group — multiple participants, one slot. */
  createGroup: (data: CreateGroupBookingRequest) =>
    api.post<ApiResponse<Booking>>('/bookings/group', data).then((r) => r.data),

  /** POST /api/bookings/multi-slot — one booking covering several slots. */
  createMultiSlot: (data: CreateMultiSlotBookingRequest) =>
    api.post<ApiResponse<Booking>>('/bookings/multi-slot', data).then((r) => r.data),

  // ── Legacy creation (backward-compatible) ─────────────────────────────────
  /** POST /api/bookings — delegates to single booking on the backend. */
  create: (data: CreateBookingRequest) =>
    api.post<ApiResponse<Booking>>('/bookings', data).then((r) => r.data),

  // ── Mutation ────────────────────────────────────────────────────────────────
  update: (id: number, data: UpdateBookingRequest) =>
    api.put<ApiResponse<Booking>>(`/bookings/${id}`, data).then((r) => r.data),

  cancel: (id: number) =>
    api.post<ApiResponse<boolean>>(`/bookings/${id}/cancel`).then((r) => r.data),

  remove: (id: number) =>
    api.delete<ApiResponse<boolean>>(`/bookings/${id}`).then((r) => r.data),

  // ── Availability (new engine) ───────────────────────────────────────────────
  getFacilityAvailability: (params: {
    facilityId: number;
    date: string;
    slotDurationMinutes?: number;
    openHour?: number;
    closeHour?: number;
  }) =>
    api.get<ApiResponse<ResourceAvailabilityResponse>>('/bookings/availability/facility', { params })
      .then((r) => r.data),

  getInstructorAvailability: (params: {
    instructorId: number;
    date: string;
    slotDurationMinutes?: number;
    openHour?: number;
    closeHour?: number;
  }) =>
    api.get<ApiResponse<ResourceAvailabilityResponse>>('/bookings/availability/instructor', { params })
      .then((r) => r.data),
};
