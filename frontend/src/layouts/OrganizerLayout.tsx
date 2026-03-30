import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, X, CalendarCheck, LogOut, Menu,
  CalendarRange, Building2, ChevronDown, Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/organizer',           icon: LayoutDashboard, label: 'Dashboard',     end: true  },
  { to: '/organizer/bookings',  icon: CalendarDays,    label: 'Bookings',      end: false },
  { to: '/organizer/schedule',  icon: CalendarRange,   label: 'Schedule',      end: false },
  { to: '/organizer/venue',     icon: Building2,       label: 'Venue Profile', end: false },
];

const TITLES: Record<string, string> = {
  '/organizer':          'My Dashboard',
  '/organizer/bookings': 'Bookings',
  '/organizer/schedule': 'Schedule',
  '/organizer/venue':    'Venue Profile',
};

function initials(name: string) {
  return name.split(' ').map((n) => n[0]?.toUpperCase() ?? '').join('').slice(0, 2);
}

export default function OrganizerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? 'Organizer';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F7FA]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────── */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white flex flex-col z-30
        shadow-[4px_0_20px_rgba(0,0,0,0.06)]
        transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0078D7] to-[#025DB6] flex items-center justify-center shadow-[0_2px_8px_-1px_rgb(0_120_215_/_0.45)]">
              <CalendarCheck size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-sm leading-none">BookingPlatform</span>
              <p className="text-[10px] text-gray-400 mt-0.5">Organizer Portal</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="px-4 mb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Navigation
          </p>
          <div className="space-y-0.5">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0078D7] to-[#025DB6] flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
              {user ? initials(user.fullName) : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate leading-none">{user?.fullName}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Organizer</p>
            </div>
            <button
              onClick={signOut}
              title="Sign out"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 shrink-0 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.04)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="hidden sm:block w-1 h-5 rounded-full bg-gradient-to-b from-[#0078D7] to-[#025DB6]" />
              <h1 className="text-base font-semibold text-gray-900">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <button className="flex items-center gap-2.5 pl-1 pr-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0078D7] to-[#025DB6] flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
                {user ? initials(user.fullName) : '?'}
              </div>
              <span className="hidden sm:block text-xs font-semibold text-gray-800">
                {user?.fullName.split(' ')[0]}
              </span>
              <ChevronDown size={13} className="text-gray-400 hidden sm:block" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
