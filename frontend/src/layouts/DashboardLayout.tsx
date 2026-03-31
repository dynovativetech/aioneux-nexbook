import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header  from './Header';

const TITLES: Record<string, string> = {
  '/dashboard':           'Dashboard',
  '/venues':              'Find a Venue',
  '/book':                'Book a Facility',
  '/booking':             'New Booking',
  '/my-bookings':         'My Bookings',
  '/complaints':          'Complaints',
  '/admin':               'Admin Dashboard',
  '/admin/bookings':      'Manage Bookings',
  '/admin/complaints':    'Manage Complaints',
  '/admin/members':       'Member Management',
  '/admin/venues':        'Manage Venues',
  '/admin/communities':   'Communities',
  '/admin/facilities':    'Manage Facilities',
  '/admin/instructors':   'Manage Instructors',
  '/admin/activities':    'Manage Activities',
  '/admin/notifications': 'Notification Settings',
  '/admin/audit':         'Audit Trail',
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? 'BookingPlatform';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F7FA]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />

        <main className="flex-1 overflow-y-auto p-5 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
