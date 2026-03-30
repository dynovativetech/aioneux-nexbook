import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, X, CalendarCheck, LogOut, Menu, FileText,
  Bell, ChevronDown, Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/superadmin',                icon: LayoutDashboard, label: 'Dashboard',      end: true },
  { to: '/superadmin/tenants',        icon: Building2,       label: 'Tenants' },
  { to: '/superadmin/users',          icon: Users,           label: 'Users' },
  { to: '/superadmin/document-types', icon: FileText,        label: 'Document Types' },
];

const TITLES: Record<string, string> = {
  '/superadmin':                 'SA Dashboard',
  '/superadmin/tenants':         'Tenants',
  '/superadmin/users':           'Users',
  '/superadmin/document-types':  'Document Types',
};

function initials(name: string) {
  return name.split(' ').map((n) => n[0]?.toUpperCase() ?? '').join('').slice(0, 2);
}

export default function SuperAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? 'SuperAdmin';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0f1117' }}>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 flex flex-col z-30
        transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}
        style={{ background: '#161b27', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-[0_2px_10px_-1px_rgb(124_58_237_/_0.5)]">
              <CalendarCheck size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm leading-none">BookingPlatform</span>
              <p className="text-[10px] text-white/40 mt-0.5">Super Admin</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-white/30 hover:bg-white/10 hover:text-white/70 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Superadmin badge */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Shield size={13} className="text-violet-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-violet-300">Dynovative Technologies</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="px-4 mb-2 text-[10px] font-bold text-white/25 uppercase tracking-widest">
            Main Menu
          </p>
          <div className="space-y-0.5">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-[0_4px_12px_-2px_rgb(124_58_237_/_0.45)]'
                      : 'text-white/50 hover:bg-white/6 hover:text-white/90 hover:translate-x-0.5'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User footer */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user ? initials(user.fullName) : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/80 truncate leading-none">{user?.fullName}</p>
              <p className="text-[10px] text-white/30 mt-0.5">Super Admin</p>
            </div>
            <button
              onClick={signOut}
              title="Sign out"
              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 shrink-0"
          style={{
            background: '#161b27',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.3)',
          }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-white/40 hover:bg-white/8 transition-colors"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="hidden sm:block w-1 h-5 rounded-full bg-gradient-to-b from-violet-500 to-violet-700" />
              <h1 className="text-base font-semibold text-white/90">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="relative p-2 rounded-xl text-white/40 hover:bg-white/8 hover:text-white/70 transition-colors">
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-[#161b27]" />
            </button>
            <div className="w-px h-6 mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <button className="flex items-center gap-2.5 pl-1 pr-2.5 py-1.5 rounded-xl hover:bg-white/8 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
                {user ? initials(user.fullName) : '?'}
              </div>
              <span className="hidden sm:block text-xs font-semibold text-white/70">
                {user?.fullName.split(' ')[0]}
              </span>
              <ChevronDown size={13} className="text-white/30 hidden sm:block" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-7" style={{ background: '#0f1117' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
