import api from './api';

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: number | null;
  entityName: string | null;
  details: string | null;
  actorId: number | null;
  actorEmail: string;
  actorName: string;
  ipAddress: string | null;
}

export interface AuditLogPage {
  total: number;
  page: number;
  pageSize: number;
  data: AuditLogEntry[];
}

export interface AuditLogFilters {
  entityType?: string;
  action?: string;
  actor?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export const auditLogService = {
  getAll: (filters: AuditLogFilters = {}): Promise<AuditLogPage> => {
    const params = new URLSearchParams();
    if (filters.entityType) params.set('entityType', filters.entityType);
    if (filters.action)     params.set('action',     filters.action);
    if (filters.actor)      params.set('actor',      filters.actor);
    if (filters.from)       params.set('from',       filters.from);
    if (filters.to)         params.set('to',         filters.to);
    params.set('page',     String(filters.page     ?? 1));
    params.set('pageSize', String(filters.pageSize ?? 50));
    return api.get<AuditLogPage>(`/auditlogs?${params}`).then(r => r.data);
  },

  getForEntity: (entityType: string, entityId: number) =>
    api.get<AuditLogEntry[]>(`/auditlogs/${entityType}/${entityId}`).then(r => r.data),
};
