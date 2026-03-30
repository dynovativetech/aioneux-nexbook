import { useEffect, useState, useCallback } from 'react';
import { Shield, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { auditLogService, type AuditLogEntry, type AuditLogFilters } from '../../services/auditLogService';
import Spinner from '../../components/ui/Spinner';
import Button  from '../../components/ui/Button';

// â”€â”€ Action color mapping â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ACTION_STYLES: Record<string, string> = {
  Create:        'bg-emerald-100 text-emerald-700',
  Update:        'bg-blue-100    text-blue-700',
  Delete:        'bg-red-100     text-red-700',
  Login:         'bg-[#cce7f9]  text-[#025DB6]',
  Register:      'bg-[#e6f3fc]  text-[#025DB6]',
  Cancel:        'bg-orange-100  text-orange-700',
  StatusChange:  'bg-purple-100  text-purple-700',
  AddComment:    'bg-gray-100   text-gray-600',
  FailedLogin:   'bg-red-100     text-red-700',
  FailedRegister:'bg-red-100     text-red-700',
};

function ActionBadge({ action }: { action: string }) {
  const cls = ACTION_STYLES[action] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {action}
    </span>
  );
}

const ENTITY_TYPES = ['', 'Booking', 'Facility', 'Activity', 'Instructor', 'Complaint', 'User'];
const ACTIONS      = ['', 'Create', 'Update', 'Delete', 'Login', 'Register', 'Cancel', 'StatusChange', 'AddComment', 'FailedLogin', 'FailedRegister'];
const PAGE_SIZE    = 50;

function fmtTs(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export default function AuditLogPage() {
  const [logs,    setLogs]    = useState<AuditLogEntry[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);

  const [filters, setFilters] = useState<AuditLogFilters>({
    entityType: '', action: '', actor: '', from: '', to: '',
  });

  const load = useCallback(async (pageNum: number, f: AuditLogFilters) => {
    setLoading(true);
    try {
      const res = await auditLogService.getAll({
        ...f,
        entityType: f.entityType || undefined,
        action:     f.action     || undefined,
        actor:      f.actor      || undefined,
        from:       f.from       || undefined,
        to:         f.to         || undefined,
        page:       pageNum,
        pageSize:   PAGE_SIZE,
      });
      setLogs(res.data);
      setTotal(res.total);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page, filters); }, [load, page, filters]);

  function applyFilter(next: Partial<AuditLogFilters>) {
    setPage(1);
    setFilters(prev => ({ ...prev, ...next }));
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Shield size={20} className="text-gray-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Audit Trail</h1>
            <p className="text-sm text-gray-500">
              {total} event{total !== 1 ? 's' : ''} recorded
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />}
          onClick={() => load(page, filters)} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Actor search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={filters.actor ?? ''}
              onChange={e => applyFilter({ actor: e.target.value })}
              placeholder="Search userâ€¦"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30 focus:border-transparent" />
          </div>

          {/* Entity type */}
          <select value={filters.entityType ?? ''}
            onChange={e => applyFilter({ entityType: e.target.value })}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30 focus:border-transparent bg-white">
            {ENTITY_TYPES.map(t => (
              <option key={t} value={t}>{t || 'All entity types'}</option>
            ))}
          </select>

          {/* Action */}
          <select value={filters.action ?? ''}
            onChange={e => applyFilter({ action: e.target.value })}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30 focus:border-transparent bg-white">
            {ACTIONS.map(a => (
              <option key={a} value={a}>{a || 'All actions'}</option>
            ))}
          </select>

          {/* From date */}
          <input type="date" value={filters.from ?? ''}
            onChange={e => applyFilter({ from: e.target.value })}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30 focus:border-transparent" />

          {/* To date */}
          <input type="date" value={filters.to ?? ''}
            onChange={e => applyFilter({ to: e.target.value })}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30 focus:border-transparent" />
        </div>

        {/* Active filter chips */}
        {(filters.entityType || filters.action || filters.actor || filters.from || filters.to) && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Active filters:</span>
            {filters.entityType && <Chip label={`Type: ${filters.entityType}`} onRemove={() => applyFilter({ entityType: '' })} />}
            {filters.action     && <Chip label={`Action: ${filters.action}`}   onRemove={() => applyFilter({ action: '' })} />}
            {filters.actor      && <Chip label={`User: ${filters.actor}`}      onRemove={() => applyFilter({ actor: '' })} />}
            {filters.from       && <Chip label={`From: ${filters.from}`}       onRemove={() => applyFilter({ from: '' })} />}
            {filters.to         && <Chip label={`To: ${filters.to}`}           onRemove={() => applyFilter({ to: '' })} />}
            <button onClick={() => applyFilter({ entityType: '', action: '', actor: '', from: '', to: '' })}
              className="text-xs text-[#0078D7] hover:underline">Clear all</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Timestamp', 'Actor', 'Action', 'Entity', 'Record', 'Details', 'IP'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400 text-sm">
                      No audit events match the current filters.
                    </td>
                  </tr>
                ) : logs.map((log: AuditLogEntry) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap font-mono">
                      {fmtTs(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 text-xs">{log.actorName}</div>
                      <div className="text-gray-400 text-xs">{log.actorEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{log.entityType}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {log.entityName && <span className="font-medium">{log.entityName}</span>}
                      {log.entityId && (
                        <span className="ml-1 text-gray-400">#{log.entityId}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs">
                      <span className="line-clamp-2" title={log.details ?? ''}>{log.details ?? 'â€”'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                      {log.ipAddress ?? 'â€”'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > PAGE_SIZE && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}â€“{Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100
                  disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-gray-600 px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100
                  disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#e6f3fc] text-[#025DB6]
      rounded-full text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-[#025DB6] leading-none">Ã—</button>
    </span>
  );
}

