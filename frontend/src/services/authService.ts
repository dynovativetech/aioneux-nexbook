import api from './api';
import type { User, UserRole } from '../types';

interface AuthApiResponse {
  success: boolean;
  message: string;
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
  tenantId?: number;
  expiresAt: string;
  errors?: string[];
}

function storeSession(data: AuthApiResponse): User {
  const user: User = {
    id:       data.userId,
    fullName: data.fullName,
    email:    data.email,
    role:     data.role,
    tenantId: data.tenantId,
  };
  localStorage.setItem('bp_token', data.token);
  localStorage.setItem('bp_user',  JSON.stringify(user));
  return user;
}

function extractMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const body = (error as { response: { data?: { message?: string } } }).response.data;
    if (body?.message) return body.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function login(email: string, password: string): Promise<User> {
  try {
    const res = await api.post<AuthApiResponse>('/auth/login', { email, password });
    if (!res.data.success) throw new Error(res.data.message);
    return storeSession(res.data);
  } catch (err) {
    throw new Error(extractMessage(err, 'Login failed. Please try again.'));
  }
}

export async function register(fullName: string, email: string, password: string): Promise<User> {
  try {
    const res = await api.post<AuthApiResponse>('/auth/register', { fullName, email, password });
    if (!res.data.success) throw new Error(res.data.message);
    return storeSession(res.data);
  } catch (err) {
    throw new Error(extractMessage(err, 'Registration failed. Please try again.'));
  }
}

export function logout(): void {
  localStorage.removeItem('bp_token');
  localStorage.removeItem('bp_user');
}

const ROLE_MAP: Record<string, UserRole> = {
  customer:  'Customer',
  admin:     'TenantAdmin',
  superadmin: 'SuperAdmin',
  tenantadmin: 'TenantAdmin',
  facilityorganizer: 'FacilityOrganizer',
};

function normalizeRole(role: string): UserRole {
  return ROLE_MAP[role.toLowerCase()] ?? (role as UserRole);
}

export function updateStoredUser(partial: Partial<User>): void {
  try {
    const raw = localStorage.getItem('bp_user');
    if (!raw) return;
    const u = JSON.parse(raw) as User;
    const updated = { ...u, ...partial };
    localStorage.setItem('bp_user', JSON.stringify(updated));
  } catch { /* ignore */ }
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('bp_user');
    if (!raw) return null;
    const u = JSON.parse(raw) as User;
    // Normalize old role values from before the multi-tenant refactor
    u.role = normalizeRole(u.role);
    return u;
  } catch {
    return null;
  }
}
