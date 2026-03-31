import api from './api';

export interface VenueListItem {
  id: number;
  name: string;
  shortDescription?: string;
  address: string;
  coverImageUrl?: string;
  logoUrl?: string;
  communityName: string;
  isActive: boolean;
  facilityCount: number;
}

export interface VenueOperatingHours {
  id: number;
  /** API sends the C# DayOfWeek enum as a string ("Sunday"…"Saturday").
   *  Some internal pages initialise it as a number (0–6) before saving. */
  dayOfWeek: number | string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface VenueAmenity {
  id: number;
  amenityType: number;
  isAvailable: boolean;
  notes?: string;
}

export interface VenueOrganizer {
  userId: number;
  userName: string;
  userEmail: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  officialEmail?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  assignedAt: string;
}

export interface VenueDetail {
  id: number;
  communityId: number;
  communityName: string;
  tenantId: number;
  name: string;
  shortDescription?: string;
  description?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  contactPersonName?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  contactPersonMobile?: string;
  isActive: boolean;
  facilityCount: number;
  images: VenueImageItem[];
  operatingHours: VenueOperatingHours[];
  amenities: VenueAmenity[];
  organizers: VenueOrganizer[];
}

export interface VenueImageItem {
  id: number;
  fileName: string;
  originalFileName: string;
  isPrimary: boolean;
  caption?: string;
  sortOrder: number;
  url: string;
}

export interface CreateVenuePayload {
  communityId: number;
  name: string;
  shortDescription?: string;
  description?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  contactPersonName?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  contactPersonMobile?: string;
  isActive: boolean;
}

export const venueService = {
  list: (params?: { communityId?: number; activeOnly?: boolean; search?: string }) =>
    api.get<VenueListItem[]>('/venue', { params }).then(r => r.data),

  get: (id: number) =>
    api.get<VenueDetail>(`/venue/${id}`).then(r => r.data),

  create: (payload: CreateVenuePayload) =>
    api.post<{ success: boolean; data: number; message: string }>('/venue', payload).then(r => r.data.data),

  update: (id: number, payload: CreateVenuePayload) =>
    api.put(`/venue/${id}`, payload).then(r => r.data),

  remove: (id: number) =>
    api.delete(`/venue/${id}`),

  // Images
  uploadImage: (id: number, file: File, caption?: string, isPrimary?: boolean) => {
    const fd = new FormData();
    fd.append('file', file);
    if (caption) fd.append('caption', caption);
    if (isPrimary !== undefined) fd.append('isPrimary', String(isPrimary));
    return api.post(`/venue/${id}/images`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  uploadLogo: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/venue/${id}/logo`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  deleteImage: (venueId: number, imageId: number) =>
    api.delete(`/venue/${venueId}/images/${imageId}`),

  // Hours
  getHours: (id: number) =>
    api.get<VenueOperatingHours[]>(`/venue/${id}/hours`).then(r => r.data),

  setHours: (id: number, hours: VenueOperatingHours[]) =>
    api.put(`/venue/${id}/hours`, { hours }).then(r => r.data),

  // Amenities
  getAmenities: (id: number) =>
    api.get<VenueAmenity[]>(`/venue/${id}/amenities`).then(r => r.data),

  setAmenities: (id: number, amenities: VenueAmenity[]) =>
    api.put(`/venue/${id}/amenities`, { amenities }).then(r => r.data),

  // Organizers
  getOrganizers: (id: number) =>
    api.get<VenueOrganizer[]>(`/venue/${id}/organizers`).then(r => r.data),

  assignOrganizer: (id: number, payload: Partial<VenueOrganizer> & { userId: number }) =>
    api.post(`/venue/${id}/organizers`, payload).then(r => r.data),

  removeOrganizer: (venueId: number, userId: number) =>
    api.delete(`/venue/${venueId}/organizers/${userId}`),

  // Booking approval
  confirmBooking: (bookingId: number) =>
    api.post(`/venue/bookings/${bookingId}/confirm`).then(r => r.data),

  rejectBooking: (bookingId: number, reason: string) =>
    api.post(`/venue/bookings/${bookingId}/reject`, JSON.stringify(reason), {
      headers: { 'Content-Type': 'application/json' },
    }).then(r => r.data),

  // ── Organizer-specific ────────────────────────────────────────────────────
  getMyVenues: () =>
    api.get<VenueListItem[]>('/venue/my-venues').then(r => r.data),

  getMyBookings: (params?: { status?: string; date?: string }) =>
    api.get<import('../types').Booking[]>('/venue/my-bookings', { params }).then(r => r.data),
};

// ── Notification settings ─────────────────────────────────────────────────────

export interface TenantEmailSettings {
  provider: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpUseSsl: boolean;
  apiKey?: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
}

export interface NotificationSetting {
  eventType: string;
  notifyCustomer: boolean;
  notifyOrganizer: boolean;
  notifyTenantAdmin: boolean;
}

export const notificationService = {
  getEmailSettings: (tenantId: number) =>
    api.get<TenantEmailSettings>(`/tenants/${tenantId}/email-settings`).then(r => r.data),

  saveEmailSettings: (tenantId: number, payload: TenantEmailSettings) =>
    api.put(`/tenants/${tenantId}/email-settings`, payload).then(r => r.data),

  getNotificationSettings: (tenantId: number) =>
    api.get<NotificationSetting[]>(`/tenants/${tenantId}/notification-settings`).then(r => r.data),

  saveNotificationSettings: (tenantId: number, settings: NotificationSetting[]) =>
    api.put(`/tenants/${tenantId}/notification-settings`, { settings }).then(r => r.data),
};
