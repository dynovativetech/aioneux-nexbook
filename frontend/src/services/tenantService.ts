import api from './api';
import type {
  Tenant,
  CreateTenantRequest,
  CreateTenantResponse,
  UpdateTenantRequest,
  PaymentSettings,
  TenantDocumentType,
  TenantDocument,
  ApiResponse,
} from '../types';

export async function getTenants(): Promise<Tenant[]> {
  const res = await api.get<ApiResponse<Tenant[]>>('/tenants');
  return res.data.data ?? [];
}

export async function getTenantById(id: number): Promise<Tenant> {
  const res = await api.get<ApiResponse<Tenant>>(`/tenants/${id}`);
  return res.data.data!;
}

export async function createTenant(request: CreateTenantRequest): Promise<CreateTenantResponse> {
  const res = await api.post<ApiResponse<CreateTenantResponse>>('/tenants', request);
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data!;
}

export async function updateTenant(id: number, request: UpdateTenantRequest): Promise<Tenant> {
  const res = await api.put<ApiResponse<Tenant>>(`/tenants/${id}`, request);
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data!;
}

export async function toggleTenantActive(id: number): Promise<Tenant> {
  const res = await api.post<ApiResponse<Tenant>>(`/tenants/${id}/toggle-active`);
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data!;
}

export async function getPaymentSettings(tenantId: number): Promise<PaymentSettings> {
  const res = await api.get<ApiResponse<PaymentSettings>>(`/tenants/${tenantId}/payment-settings`);
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data!;
}

export async function updatePaymentSettings(tenantId: number, settings: PaymentSettings): Promise<PaymentSettings> {
  const res = await api.put<ApiResponse<PaymentSettings>>(`/tenants/${tenantId}/payment-settings`, settings);
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data!;
}

export async function uploadLogo(tenantId: number, file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await api.post<{ success: boolean; logoUrl: string }>(`/tenants/${tenantId}/logo`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (!res.data.success) throw new Error('Logo upload failed');
  return res.data.logoUrl;
}

// ── Document types ────────────────────────────────────────────────────────────

export async function getDocumentTypes(): Promise<TenantDocumentType[]> {
  const res = await api.get<ApiResponse<TenantDocumentType[]>>('/document-types');
  return res.data.data ?? [];
}

export async function createDocumentType(name: string, description?: string, isRequired = false, sortOrder = 0): Promise<TenantDocumentType> {
  const res = await api.post<ApiResponse<TenantDocumentType>>('/document-types', { name, description, isRequired, sortOrder });
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data!;
}

export async function deleteDocumentType(id: number): Promise<void> {
  await api.delete(`/document-types/${id}`);
}

// ── Tenant documents ──────────────────────────────────────────────────────────

export async function getTenantDocuments(tenantId: number): Promise<TenantDocument[]> {
  const res = await api.get<ApiResponse<TenantDocument[]>>(`/tenants/${tenantId}/documents`);
  return res.data.data ?? [];
}

export async function uploadTenantDocument(tenantId: number, documentTypeId: number, file: File, notes?: string): Promise<TenantDocument> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('documentTypeId', String(documentTypeId));
  if (notes) fd.append('notes', notes);
  const res = await api.post<ApiResponse<TenantDocument>>(`/tenants/${tenantId}/documents`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data!;
}

export async function deleteTenantDocument(tenantId: number, docId: number): Promise<void> {
  await api.delete(`/tenants/${tenantId}/documents/${docId}`);
}
