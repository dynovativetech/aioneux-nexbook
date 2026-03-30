import { useEffect, useState } from 'react';
import { Building2, Users, CalendarDays, TrendingUp, CheckCircle2 } from 'lucide-react';
import { getTenants } from '../../services/tenantService';
import type { Tenant } from '../../types';

export default function SADashboardPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTenants().then(setTenants).catch(console.error).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Total Tenants',    value: tenants.length,                         icon: Building2,    iconBg: 'bg-violet-500/10', iconText: 'text-violet-400' },
    { label: 'Active Tenants',   value: tenants.filter(t => t.isActive).length,  icon: TrendingUp,   iconBg: 'bg-emerald-500/10', iconText: 'text-emerald-400' },
    { label: 'Inactive Tenants', value: tenants.filter(t => !t.isActive).length, icon: Building2,    iconBg: 'bg-amber-500/10',   iconText: 'text-amber-400' },
    { label: 'Platform Users',   value: '—',                                     icon: Users,        iconBg: 'bg-blue-500/10',    iconText: 'text-blue-400' },
    { label: 'Total Bookings',   value: '—',                                     icon: CalendarDays, iconBg: 'bg-purple-500/10',  iconText: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white/90">Platform Overview</h2>
        <p className="text-white/40 mt-0.5 text-sm">Stats across all tenants on Dynovative Technologies</p>
      </div>

      {loading ? (
        <div className="text-white/30 text-sm">Loading…</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map(({ label, value, icon: Icon, iconBg, iconText }) => (
            <div key={label}
              className="rounded-2xl p-5 border hover:-translate-y-0.5 transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.07)',
              }}
            >
              <div className={`inline-flex p-2.5 rounded-xl ${iconBg} mb-3`}>
                <Icon size={18} className={iconText} />
              </div>
              <p className="text-2xl font-bold text-white/90">{value}</p>
              <p className="text-xs text-white/40 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tenants table */}
      <div className="rounded-2xl overflow-hidden border"
        style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h3 className="font-semibold text-white/80 text-sm">All Tenants</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Name', 'Slug', 'Contact', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-5 py-3.5 font-medium text-white/80">{t.name}</td>
                  <td className="px-5 py-3.5 text-white/40 font-mono text-xs">{t.slug}</td>
                  <td className="px-5 py-3.5 text-white/40">{t.contactEmail}</td>
                  <td className="px-5 py-3.5">
                    {t.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 size={11} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-400/10 px-2.5 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-white/20">No tenants yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
