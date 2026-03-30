// ── Roles ────────────────────────────────────────────────────────────────────
export type UserRole = 'SuperAdmin' | 'TenantAdmin' | 'FacilityOrganizer' | 'Customer';

// ── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  tenantId?: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
  tenantId?: number;
  expiresAt: string;
}

// ── Tenant ────────────────────────────────────────────────────────────────────
export interface Tenant {
  id: number;
  // Company
  name: string;
  slug: string;
  loginUrl?: string;
  contactEmail: string;
  contactPhone?: string;
  companyMobile?: string;
  website?: string;
  logoUrl?: string;
  trn?: string;
  // Company address (country first)
  defaultCountryId?: number;
  defaultCountryName?: string;
  stateProvince?: string;
  defaultCityText?: string;
  street?: string;
  postalCode?: string;
  // Contact person
  contactTitle?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactMobilePhone?: string;
  contactPersonEmail?: string;
  // Contact person address
  contactCountryId?: number;
  contactCountryName?: string;
  contactState?: string;
  contactCityText?: string;
  contactStreet?: string;
  contactPostalCode?: string;
  // Status
  isActive: boolean;
  createdAt: string;
}

export interface PaymentSettings {
  acceptCash: boolean;
  acceptOnline: boolean;
  ccAvenueEnabled: boolean;
  ccAvenueMerchantId?: string;
  ccAvenueAccessCode?: string;
  ccAvenueWorkingKey?: string;
  magnatiEnabled: boolean;
  magnatiApiKey?: string;
  magnatiMerchantId?: string;
  magnatiSecretKey?: string;
}

export interface TenantDocumentType {
  id: number;
  name: string;
  description?: string;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface TenantDocument {
  id: number;
  documentTypeId: number;
  documentTypeName: string;
  originalFileName: string;
  fileSizeBytes: number;
  notes?: string;
  uploadedAt: string;
  downloadUrl: string;
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
  loginUrl?: string;
  contactEmail: string;
  contactPhone?: string;
  companyMobile?: string;
  website?: string;
  logoUrl?: string;
  trn?: string;
  defaultCountryId?: number;
  stateProvince?: string;
  defaultCityText?: string;
  street?: string;
  postalCode?: string;
  contactTitle?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactMobilePhone?: string;
  contactPersonEmail?: string;
  contactCountryId?: number;
  contactState?: string;
  contactCityText?: string;
  contactStreet?: string;
  contactPostalCode?: string;
  sendWelcomeEmail?: boolean;
  paymentSettings?: PaymentSettings;
}

export interface UpdateTenantRequest {
  name: string;
  loginUrl?: string;
  contactEmail: string;
  contactPhone?: string;
  companyMobile?: string;
  website?: string;
  logoUrl?: string;
  trn?: string;
  defaultCountryId?: number;
  stateProvince?: string;
  defaultCityText?: string;
  street?: string;
  postalCode?: string;
  contactTitle?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactMobilePhone?: string;
  contactPersonEmail?: string;
  contactCountryId?: number;
  contactState?: string;
  contactCityText?: string;
  contactStreet?: string;
  contactPostalCode?: string;
}

/** Only returned from POST /api/tenants. tempPassword is null on all other reads. */
export interface CreateTenantResponse extends Tenant {
  tempPassword?: string;
}

// ── Location hierarchy ────────────────────────────────────────────────────────
export interface Country {
  id: number;
  name: string;
  code: string;
}

export interface City {
  id: number;
  countryId: number;
  countryName: string;
  name: string;
}

export interface Area {
  id: number;
  cityId: number;
  cityName: string;
  tenantId: number;
  name: string;
}

export interface Community {
  id: number;
  areaId: number;
  areaName: string;
  tenantId: number;
  name: string;
  description?: string;
}

export interface Venue {
  id: number;
  communityId: number;
  communityName: string;
  tenantId: number;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  contactEmail?: string;
  isActive: boolean;
}

// ── Domain entities ──────────────────────────────────────────────────────────
export interface FacilityImage {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface FacilityActivity {
  activityId: number;
  activityName: string;
}

export interface Facility {
  id: number;
  name: string;
  location: string;
  capacity: number;
  tenantId: number;
  venueId?: number;
  venueName?: string;
  code?: string;
  description?: string;
  shortDescription?: string;
  latitude?: number;
  longitude?: number;
  mapAddress?: string;
  physicalAddress?: string;
  contactPersonName?: string;
  contactEmail?: string;
  contactPhone?: string;
  bookingConfirmationEmail?: string;
  isActive: boolean;
  requiresApproval: boolean;
  slotDurationMinutes: number;
  maxConsecutiveSlots: number;
  images: FacilityImage[];
  facilityActivities?: FacilityActivity[];
}

export interface Activity {
  id: number;
  name: string;
  durationMinutes: number;
  tenantId: number;
  description?: string;
  category?: string;
  bufferMinutes: number;
  price: number;
  isActive: boolean;
}

export interface Instructor {
  id: number;
  name: string;
  expertise: string;
  experienceYears: number;
  tenantId: number;
  bio?: string;
  expertiseSummary?: string;
  profileImageUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
}

export interface InstructorSkill {
  instructorId: number;
  activityId: number;
  proficiencyLevel?: number;
  certificationNote?: string;
}

// ── Notification ──────────────────────────────────────────────────────────────
export interface NotificationLog {
  id: number;
  tenantId: number;
  bookingId?: number;
  event: string;
  type: string;
  recipientEmail: string;
  subject: string;
  isSent: boolean;
  createdAt: string;
}

// ── Bookings ─────────────────────────────────────────────────────────────────
export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
export type BookingType   = 'Single' | 'Group' | 'MultiSlot';
export type ReservationStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';

export interface BookingParticipant {
  fullName: string;
  email?: string;
  phone?: string;
}

export interface FacilityReservation {
  id: number;
  facilityId: number;
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  label: string;
}

export interface InstructorReservation {
  id: number;
  instructorId: number;
  instructorName?: string;
  activityId: number;
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  label: string;
}

export interface Booking {
  id: number;
  tenantId: number;
  userId: number;
  userName: string;
  facilityId: number;
  facilityName: string;
  activityId: number;
  activityName: string;
  instructorId?: number;
  instructorName?: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  bookingType?: BookingType;
  participantCount?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  participants?: BookingParticipant[];
  facilityReservations?: FacilityReservation[];
  instructorReservations?: InstructorReservation[];
}

// ── Booking request DTOs ─────────────────────────────────────────────────────
export interface CreateBookingRequest {
  userId: number;
  facilityId: number;
  activityId: number;
  instructorId?: number;
  startTime: string;
  endTime: string;
  participantCount?: number;
  participants?: BookingParticipant[];
  notes?: string;
}

export interface CreateGroupBookingRequest extends CreateBookingRequest {
  participantCount: number;
  participants: BookingParticipant[];
}

export interface TimeSlotRequest {
  startTime: string;
  endTime: string;
}

export interface CreateMultiSlotBookingRequest {
  userId: number;
  facilityId: number;
  activityId: number;
  instructorId?: number;
  slots: TimeSlotRequest[];
  participantCount?: number;
  participants?: BookingParticipant[];
  notes?: string;
}

export interface UpdateBookingRequest extends CreateBookingRequest {
  status: BookingStatus;
}

// ── Availability ─────────────────────────────────────────────────────────────
export interface TimeSlot {
  startTime: string;
  endTime: string;
  label: string;
}

export interface AvailabilityResponse {
  facilityId: number;
  facilityName: string;
  date: string;
  slotDurationMinutes: number;
  instructorId?: number;
  instructorName?: string;
  totalSlots: number;
  availableSlotCount: number;
  bookedSlotCount: number;
  availableSlots: TimeSlot[];
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
  durationMinutes: number;
  label: string;
}

export interface ResourceAvailabilityResponse {
  resourceId: number;
  resourceName: string;
  resourceType: 'Facility' | 'Instructor';
  date: string;
  slotDurationMinutes: number;
  totalSlots: number;
  availableSlotCount: number;
  bookedSlotCount: number;
  availableSlots: AvailableSlot[];
}

// ── Complaints ───────────────────────────────────────────────────────────────
export type ComplaintStatus = 'Open' | 'InProgress' | 'Resolved' | 'Rejected';

export interface ComplaintComment {
  id: number;
  authorId: number;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface Complaint {
  id: number;
  tenantId: number;
  bookingId: number;
  userId: number;
  userName: string;
  title: string;
  description: string;
  status: ComplaintStatus;
  createdAt: string;
  comments: ComplaintComment[];
}

export interface CreateComplaintRequest {
  bookingId: number;
  userId: number;
  title: string;
  description: string;
}

// ── Generic API envelope ─────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}
