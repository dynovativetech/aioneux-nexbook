import api from './api';
import type { ApiResponse, AvailabilityResponse } from '../types';

export interface AvailabilityParams {
  facilityId: number;
  date: string;          // yyyy-MM-dd
  slotDurationMinutes?: number;
  instructorId?: number;
  openHour?: number;
  closeHour?: number;
}

export const availabilityService = {
  getSlots: (params: AvailabilityParams) =>
    api
      .get<ApiResponse<AvailabilityResponse>>('/availability', { params })
      .then((r) => r.data),
};
