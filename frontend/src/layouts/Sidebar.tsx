import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CalendarPlus, CalendarDays, MessageSquareWarning,
  Building2, UserCheck, Dumbbell, ShieldCheck, X, CalendarCheck, Shield,
  MapPin, Bell, Search, Tag, Activity, Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props { open: boolean; onClose: () => void; }

const customerLinks = [
  { to: '/dashboard',      icon: LayoutDashboard,      label: 'Dashboard' },
  { to: '/venues',         icon: Search,               label: 'Find a Venue' },
  { to: '/book',           icon: CalendarPlus,         label: 'Book a Facility' },
  { to: '/my-bookings',    icon: CalendarDays,         label: 'My Bookings' },
  { to: '/activity-feed',  icon: Activity,             label: 'Activity Feed' },
  { to: '/complaints',     icon: MessageSquareWarning, label: 'My Complaints' },
];

type NavGroup = { group: string; items: { to: string; icon: React.ElementType; label: string }[] };

const adminNavGroups: NavGroup[] = [
  {
    group: 'Overview',
    items: [
      { to: '/admin', icon: ShieldCheck, label: 'Dashboard' },
    ],
  },
  {
    group: 'Venues',
    items: [
      { to: '/admin/venues',      icon: Building2, label: 'Venues' },
      { to: '/admin/communities', icon: MapPin,    label: 'Communities' },
    ],
  },
  {
    group: 'Manage',
    items: [
      { to: '/admin/members', icon: Users, label: 'Members' },
      { to: '/admin/bookings',              icon: CalendarDays,         label: 'Bookings' },
      { to: '/admin/complaints',            icon: MessageSquareWarning, label: 'Complaints' },
      { to: '/admin/complaint-categories',  icon: Tag,                  label: 'Complaint Categories' },
      { to: '/admin/facilities',            icon: Building2,            label: 'Facilities' },
      { to: '/admin/instructors',           icon: UserCheck,            label: 'Instructors' },
      { to: '/admin/activities',            icon: Dumbbell,             label: 'Activities' },
    ],
  },
  {
    group: 'System',
    items: [
      { to: '/admin/notifications', icon: Bell,   label: 'Notifications' },
      { to: '/admin/audit',         icon: Shield, label: 'Audit Trail' },
    ],
  },
];

export default function Sidebar({ open, onClose }: Props) {
  const { isTenantAdmin } = useAuth();
  const isAdmin = isTenantAdmin;

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white flex flex-col z-30
        shadow-[4px_0_20px_rgba(0,0,0,0.06)]
        transition-transform duration-300 ease-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}>

        {/* ── Logo ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0078D7] to-[#025DB6] flex items-center justify-center shadow-[0_2px_8px_-1px_rgb(0_120_215_/_0.45)]">
              <CalendarCheck size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-sm leading-none">NexBook</span>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {isAdmin ? 'Admin Portal' : 'Member Portal'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Nav links ────────────────────────────── */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          {isAdmin ? (
            adminNavGroups.map(({ group, items }) => (
              <div key={group} className="mb-5">
                <p className="px-4 mb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {group}
                </p>
                <div className="space-y-0.5">
                  {items.map(({ to, icon: Icon, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === '/admin'}
                      onClick={onClose}
                      className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                      <Icon size={16} />
                      {label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-0.5">
              {customerLinks.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/dashboard'}
                  onClick={onClose}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* ── Company branding footer ──────────────── */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl bg-gradient-to-r from-[#e6f3fc] to-[#cce7f9]/50">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0078D7] to-[#025DB6] flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_-1px_rgb(0_120_215_/_0.40)]">
              <CalendarCheck size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#025DB6] leading-none">NexBook</p>
              <p className="text-[10px] text-[#0078D7]/70 mt-0.5 truncate">Powered by Dynovative</p>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
}
