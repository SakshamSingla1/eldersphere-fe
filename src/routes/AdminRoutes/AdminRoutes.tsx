import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import ElderlyIcon from "@mui/icons-material/Elderly";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import EventNoteIcon from "@mui/icons-material/EventNote";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import RateReviewIcon from "@mui/icons-material/RateReview";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import WebIcon from "@mui/icons-material/Web";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import TuneIcon from "@mui/icons-material/Tune";
import InsightsIcon from "@mui/icons-material/Insights";
import DashboardLayout from "../../layouts/DashboardLayout";
import Loader from "../../components/atoms/Loader/Loader";
import type { SidebarNavItem } from "../../components/molecules/Sidebar/Sidebar";
import ProtectedRoute from "../ProtectedRoute";
import { useAuthenticatedUser } from "../../hooks/useAuthenticatedUser";
import { UserTypeEnum } from "../../utils/enums";

// Each admin page is its own lazy chunk — the AdminRoutes chunk previously bundled every
// admin page (including Analytics, which pulls in recharts) up front, making it the
// largest chunk in the app (~438kB). Splitting per-page means a session only pays for
// the pages it actually visits.
const AdminDashboardPage = lazy(() => import("../../components/pages/Admin/Dashboard.page"));
const AdminUsersPage = lazy(() => import("../../components/pages/Admin/Users.page"));
const AdminCaretakerVerificationPage = lazy(() => import("../../components/pages/Admin/CaretakerVerification.page"));
const AdminElderProfilesPage = lazy(() => import("../../components/pages/Admin/ElderProfiles.page"));
const AdminServicesPage = lazy(() => import("../../components/pages/Admin/Services.page"));
const AdminBookingsPage = lazy(() => import("../../components/pages/Admin/Bookings.page"));
const AdminMedicalRecordsPage = lazy(() => import("../../components/pages/Admin/MedicalRecords.page"));
const AdminReviewsPage = lazy(() => import("../../components/pages/Admin/Reviews.page"));
const AdminEmergencyAlertsPage = lazy(() => import("../../components/pages/Admin/EmergencyAlerts.page"));
const AdminAnalyticsPage = lazy(() => import("../../components/pages/Admin/Analytics.page"));
const AdminLandingManagementPage = lazy(() => import("../../components/pages/Admin/LandingManagement.page"));
const AdminContactUsPage = lazy(() => import("../../components/pages/Admin/ContactUs.page"));
const AdminRolesPermissionsPage = lazy(() => import("../../components/pages/Admin/RolesPermissions.page"));
const AdminPlatformSettingsPage = lazy(() => import("../../components/pages/Admin/PlatformSettings.page"));
const AccountSettingsPage = lazy(() => import("../../components/pages/Shared/AccountSettings.page"));

// Roles & Permissions and Platform Settings are gated to SUPER_ADMIN on the backend
// (RoleController / PermissionController / PlatformSettingsController all require
// hasRole('SUPER_ADMIN'), which the role hierarchy does NOT widen from ADMIN) — a plain
// ADMIN would get a 403 hitting either, so those two nav entries and routes are hidden/
// guarded for ADMIN sessions. Admin-account creation (via Users) has no such backend
// split (AdminController is hasRole('ADMIN'), which SUPER_ADMIN also satisfies), so it
// stays visible to both.
interface AdminNavItem extends SidebarNavItem {
  superAdminOnly?: boolean;
}

// Grouped into labeled sections (see Sidebar's `group` support) so the ~13-item flat list
// (a "wall of text") reads as a few clear clusters instead — routes and item set are
// unchanged, only the order/grouping for display. Order below is the display order, so
// items are listed in group-contiguous order rather than the original flat order.
const NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", path: "/admin/dashboard", icon: <DashboardIcon />, group: "Overview" },
  { label: "Analytics", path: "/admin/analytics", icon: <InsightsIcon />, group: "Overview" },
  { label: "Users", path: "/admin/users", icon: <PeopleIcon />, group: "Care Operations" },
  { label: "Caretaker Verification", path: "/admin/caretaker-verification", icon: <VerifiedUserIcon />, group: "Care Operations" },
  { label: "Elder Profiles", path: "/admin/elder-profiles", icon: <ElderlyIcon />, group: "Care Operations" },
  { label: "Services", path: "/admin/services", icon: <MedicalServicesIcon />, group: "Care Operations" },
  { label: "Bookings", path: "/admin/bookings", icon: <EventNoteIcon />, group: "Care Operations" },
  { label: "Medical Records", path: "/admin/medical-records", icon: <FolderSharedIcon />, group: "Care Operations" },
  { label: "Reviews", path: "/admin/reviews", icon: <RateReviewIcon />, group: "Care Operations" },
  { label: "Emergency Alerts", path: "/admin/emergency-alerts", icon: <WarningAmberIcon />, group: "Care Operations" },
  { label: "Landing Management", path: "/admin/landing-management", icon: <WebIcon />, group: "Content" },
  { label: "Contact Us", path: "/admin/contact-us", icon: <ContactMailIcon />, group: "Content" },
  { label: "Roles & Permissions", path: "/admin/roles-permissions", icon: <AdminPanelSettingsIcon />, superAdminOnly: true, group: "Platform" },
  { label: "Platform Settings", path: "/admin/platform-settings", icon: <TuneIcon />, superAdminOnly: true, group: "Platform" },
];

const AdminRoutes: React.FC = () => {
  const { user } = useAuthenticatedUser();
  const isSuperAdmin = user?.userType === UserTypeEnum.SUPER_ADMIN;
  const navItems = NAV_ITEMS.filter((item) => !item.superAdminOnly || isSuperAdmin);

  return (
    <Suspense fallback={<Loader minHeight="60vh" />}>
      <Routes>
        <Route
          element={
            <DashboardLayout navItems={navItems} roleLabel={isSuperAdmin ? "Super Admin" : "Admin"} settingsPath="/admin/settings" />
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="caretaker-verification" element={<AdminCaretakerVerificationPage />} />
          <Route path="elder-profiles" element={<AdminElderProfilesPage />} />
          <Route path="services" element={<AdminServicesPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="medical-records" element={<AdminMedicalRecordsPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="emergency-alerts" element={<AdminEmergencyAlertsPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="landing-management" element={<AdminLandingManagementPage />} />
          <Route path="contact-us" element={<AdminContactUsPage />} />
          <Route
            path="roles-permissions"
            element={
              <ProtectedRoute allowedUserTypes={[UserTypeEnum.SUPER_ADMIN]}>
                <AdminRolesPermissionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="platform-settings"
            element={
              <ProtectedRoute allowedUserTypes={[UserTypeEnum.SUPER_ADMIN]}>
                <AdminPlatformSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="settings" element={<AccountSettingsPage />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AdminRoutes;
