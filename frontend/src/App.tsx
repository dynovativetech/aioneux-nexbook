import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ApiHealthProvider } from './context/ApiHealthContext';
import OfflineOverlay from './components/ui/OfflineOverlay';

import DashboardLayout      from './layouts/DashboardLayout';
import LoginPage            from './pages/auth/LoginPage';
import RegisterPage         from './pages/auth/RegisterPage';

// Customer pages
import DashboardPage        from './pages/customer/DashboardPage';
import ActivityFeedPage     from './pages/customer/ActivityFeedPage';
import BookingPage          from './pages/customer/BookingPage';
import MyBookingsPage       from './pages/customer/MyBookingsPage';
import ComplaintPage        from './pages/customer/ComplaintPage';
import VenueListingPage     from './pages/customer/VenueListingPage';
import VenuePublicPage      from './pages/customer/VenuePublicPage';
import FacilityBookingPage  from './pages/customer/FacilityBookingPage';
import CommunityAnnouncementsPage from './pages/customer/CommunityAnnouncementsPage';
import CommunityEventsPage        from './pages/customer/CommunityEventsPage';
import CommunityRulesPage         from './pages/customer/CommunityRulesPage';
import FavoritesPage              from './pages/customer/FavoritesPage';

// TenantAdmin pages
import AdminDashboardPage       from './pages/admin/AdminDashboardPage';
import ManageBookingsPage       from './pages/admin/ManageBookingsPage';
import ManageComplaintsPage          from './pages/admin/ManageComplaintsPage';
import ManageComplaintCategoriesPage from './pages/admin/ManageComplaintCategoriesPage';
import ManageFacilitiesPage     from './pages/admin/ManageFacilitiesPage';
import ManageInstructorsPage    from './pages/admin/ManageInstructorsPage';
import ManageActivitiesPage     from './pages/admin/ManageActivitiesPage';
import AuditLogPage             from './pages/admin/AuditLogPage';
import ManageVenuesPage         from './pages/admin/ManageVenuesPage';
import ManageMembersPage        from './pages/admin/ManageMembersPage';
import ManageCommunitiesPage    from './pages/admin/ManageCommunitiesPage';
import NotificationSettingsPage from './pages/admin/NotificationSettingsPage';
import ManageAnnouncementsPage  from './pages/admin/ManageAnnouncementsPage';
import ContentAnalyticsPage     from './pages/admin/ContentAnalyticsPage';
import ManageEventsPage         from './pages/admin/ManageEventsPage';
import ManageRulesPage          from './pages/admin/ManageRulesPage';

// SuperAdmin pages
import SuperAdminLayout     from './layouts/SuperAdminLayout';
import SADashboardPage      from './pages/superadmin/SADashboardPage';
import SATenantsPage        from './pages/superadmin/SATenantsPage';
import SAUsersPage          from './pages/superadmin/SAUsersPage';
import SADocumentTypesPage  from './pages/superadmin/SADocumentTypesPage';

// Organizer pages
import OrganizerLayout      from './layouts/OrganizerLayout';
import OrgDashboardPage     from './pages/organizer/OrgDashboardPage';
import OrgBookingsPage      from './pages/organizer/OrgBookingsPage';
import OrgSchedulePage      from './pages/organizer/OrgSchedulePage';
import OrgVenueProfilePage  from './pages/organizer/OrgVenueProfilePage';

type GuardProps = {
  children: React.ReactNode;
  roles?: string[];
};

function ProtectedRoute({ children, roles }: GuardProps) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // If the user is authenticated but has the wrong role, send to login
  // (avoids infinite loops when a stale session has an unexpected role value)
  if (roles && role && !roles.includes(role)) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const { isAuthenticated, isSuperAdmin, isTenantAdmin, isOrganizer } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isSuperAdmin)  return <Navigate to="/superadmin" replace />;
  if (isTenantAdmin) return <Navigate to="/admin" replace />;
  if (isOrganizer)   return <Navigate to="/organizer" replace />;
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* SuperAdmin portal */}
      <Route element={
        <ProtectedRoute roles={['SuperAdmin']}>
          <SuperAdminLayout />
        </ProtectedRoute>
      }>
        <Route path="/superadmin"                element={<SADashboardPage />} />
        <Route path="/superadmin/tenants"        element={<SATenantsPage />} />
        <Route path="/superadmin/users"          element={<SAUsersPage />} />
        <Route path="/superadmin/document-types" element={<SADocumentTypesPage />} />
      </Route>

      {/* TenantAdmin portal */}
      <Route element={
        <ProtectedRoute roles={['TenantAdmin']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route path="/admin"                       element={<AdminDashboardPage />} />
        <Route path="/admin/announcements"         element={<ManageAnnouncementsPage />} />
        <Route path="/admin/analytics"             element={<ContentAnalyticsPage />} />
        <Route path="/admin/events"                element={<ManageEventsPage />} />
        <Route path="/admin/rules"                 element={<ManageRulesPage />} />
        <Route path="/admin/members"               element={<ManageMembersPage />} />
        <Route path="/admin/bookings"              element={<ManageBookingsPage />} />
        <Route path="/admin/complaints"             element={<ManageComplaintsPage />} />
        <Route path="/admin/complaint-categories"  element={<ManageComplaintCategoriesPage />} />
        <Route path="/admin/venues"                element={<ManageVenuesPage />} />
        <Route path="/admin/communities"           element={<ManageCommunitiesPage />} />
        <Route path="/admin/facilities"            element={<ManageFacilitiesPage />} />
        <Route path="/admin/instructors"           element={<ManageInstructorsPage />} />
        <Route path="/admin/activities"            element={<ManageActivitiesPage />} />
        <Route path="/admin/notifications"         element={<NotificationSettingsPage />} />
        <Route path="/admin/audit"                 element={<AuditLogPage />} />
      </Route>

      {/* Organizer portal */}
      <Route element={
        <ProtectedRoute roles={['FacilityOrganizer']}>
          <OrganizerLayout />
        </ProtectedRoute>
      }>
        <Route path="/organizer"          element={<OrgDashboardPage />} />
        <Route path="/organizer/bookings" element={<OrgBookingsPage />} />
        <Route path="/organizer/schedule" element={<OrgSchedulePage />} />
        <Route path="/organizer/venue"    element={<OrgVenueProfilePage />} />
      </Route>

      {/* Customer portal */}
      <Route element={
        <ProtectedRoute roles={['Customer']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard"         element={<DashboardPage />} />
        <Route path="/venues"            element={<VenueListingPage />} />
        <Route path="/venues/:id"        element={<VenuePublicPage />} />
        <Route path="/book"              element={<FacilityBookingPage />} />
        <Route path="/booking"           element={<BookingPage />} />
        <Route path="/my-bookings"       element={<MyBookingsPage />} />
        <Route path="/activity-feed"     element={<ActivityFeedPage />} />
        <Route path="/complaints"        element={<ComplaintPage />} />
        <Route path="/favorites"         element={<FavoritesPage />} />
        <Route path="/community/announcements" element={<CommunityAnnouncementsPage />} />
        <Route path="/community/events"        element={<CommunityEventsPage />} />
        <Route path="/community/rules"         element={<CommunityRulesPage />} />
      </Route>

      {/* Root redirect */}
      <Route path="/"  element={<RootRedirect />} />
      <Route path="*"  element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Wrap the entire app with API health monitoring
const OriginalApp = App;
export default function AppWithHealth() {
  return (
    <ApiHealthProvider>
      <OriginalApp />
      <OfflineOverlay />
    </ApiHealthProvider>
  );
}
