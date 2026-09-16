import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import Loader from "../../components/atoms/Loader/Loader";
import ProtectedRoute from "../ProtectedRoute";
import { useAuthenticatedUser } from "../../hooks/useAuthenticatedUser";
import { useSidebarNavItems } from "../../hooks/useSidebarNavItems";
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
const AdminPaymentsPage = lazy(() => import("../../components/pages/Admin/Payments.page"));
const AdminMedicalRecordsPage = lazy(() => import("../../components/pages/Admin/MedicalRecords.page"));
const AdminReviewsPage = lazy(() => import("../../components/pages/Admin/Reviews.page"));
const AdminEmergencyAlertsPage = lazy(() => import("../../components/pages/Admin/EmergencyAlerts.page"));
const AdminAnalyticsPage = lazy(() => import("../../components/pages/Admin/Analytics.page"));
const AdminLandingManagementPage = lazy(() => import("../../components/pages/Admin/LandingManagement.page"));
const AdminContactUsPage = lazy(() => import("../../components/pages/Admin/ContactUs.page"));
const AdminRolesPermissionsPage = lazy(() => import("../../components/pages/Admin/RolesPermissions.page"));
const AdminPlatformSettingsPage = lazy(() => import("../../components/pages/Admin/PlatformSettings.page"));
const AdminNavLinksPage = lazy(() => import("../../components/pages/Admin/NavLinks.page"));
const AdminMessagesPage = lazy(() => import("../../components/pages/Admin/Messages.page"));
const AccountSettingsPage = lazy(() => import("../../components/pages/Shared/AccountSettings.page"));

// Add/Edit form PAGES for the CrudModule-based listings above — each its own lazy chunk,
// same rationale as the listing pages themselves. See CrudFormPage.template.tsx.
const AdminUserFormPage = lazy(() => import("../../components/pages/Admin/UsersForm.page"));
const AdminServiceFormPage = lazy(() => import("../../components/pages/Admin/ServicesForm.page"));
const AdminBookingFormPage = lazy(() => import("../../components/pages/Admin/BookingsForm.page"));
const AdminMedicalRecordFormPage = lazy(() => import("../../components/pages/Admin/MedicalRecordsForm.page"));
const AdminContactUsFormPage = lazy(() => import("../../components/pages/Admin/ContactUsForm.page"));
const AdminCaretakerVerificationFormPage = lazy(() => import("../../components/pages/Admin/CaretakerVerificationForm.page"));
const AdminEmergencyAlertFormPage = lazy(() => import("../../components/pages/Admin/EmergencyAlertsForm.page"));
const AdminRoleFormPage = lazy(() => import("../../components/pages/Admin/RoleForm.page"));
const AdminPermissionFormPage = lazy(() => import("../../components/pages/Admin/PermissionForm.page"));
const AdminLandingFeatureFormPage = lazy(() => import("../../components/pages/Admin/LandingFeatureForm.page"));
const AdminLandingFaqFormPage = lazy(() => import("../../components/pages/Admin/LandingFaqForm.page"));
const AdminLandingTestimonialFormPage = lazy(() => import("../../components/pages/Admin/LandingTestimonialForm.page"));
const AdminNavLinkFormPage = lazy(() => import("../../components/pages/Admin/NavLinkForm.page"));

// The sidebar itself is DB-backed (see NavLinkController / useSidebarNavItems) and already
// resolves super-admin-only and required-permission gates server-side (AdminPermissionGuard)
// — a plain ADMIN's fetched list never includes a super-admin-only item, so no client-side
// filtering happens here. Roles & Permissions, Platform Settings, and Navigation Links are
// still additionally wrapped in ProtectedRoute below: the sidebar controls what's *shown*,
// this controls what's *reachable* by URL — the same defense-in-depth the backend routes
// enforce (RoleController/PermissionController/PlatformSettingsController/NavLinkController
// admin-write-routes are all hasRole('SUPER_ADMIN'), which the role hierarchy does not widen
// from ADMIN, so a plain ADMIN hitting either would get a 403 regardless).
const AdminRoutes: React.FC = () => {
  const { user } = useAuthenticatedUser();
  const { navItems, loading } = useSidebarNavItems();
  const isSuperAdmin = user?.userType === UserTypeEnum.SUPER_ADMIN;

  if (loading) return <Loader minHeight="100vh" />;

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
          <Route path="users/new" element={<AdminUserFormPage />} />
          <Route path="users/:id/edit" element={<AdminUserFormPage />} />
          <Route path="caretaker-verification" element={<AdminCaretakerVerificationPage />} />
          <Route path="caretaker-verification/:id/edit" element={<AdminCaretakerVerificationFormPage />} />
          <Route path="elder-profiles" element={<AdminElderProfilesPage />} />
          <Route path="services" element={<AdminServicesPage />} />
          <Route path="services/new" element={<AdminServiceFormPage />} />
          <Route path="services/:id/edit" element={<AdminServiceFormPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="bookings/:id/edit" element={<AdminBookingFormPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="medical-records" element={<AdminMedicalRecordsPage />} />
          <Route path="medical-records/:id/edit" element={<AdminMedicalRecordFormPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="emergency-alerts" element={<AdminEmergencyAlertsPage />} />
          <Route path="emergency-alerts/:id/edit" element={<AdminEmergencyAlertFormPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="landing-management" element={<AdminLandingManagementPage />} />
          <Route path="landing-management/features/new" element={<AdminLandingFeatureFormPage />} />
          <Route path="landing-management/features/:id/edit" element={<AdminLandingFeatureFormPage />} />
          <Route path="landing-management/faqs/new" element={<AdminLandingFaqFormPage />} />
          <Route path="landing-management/faqs/:id/edit" element={<AdminLandingFaqFormPage />} />
          <Route path="landing-management/testimonials/new" element={<AdminLandingTestimonialFormPage />} />
          <Route path="landing-management/testimonials/:id/edit" element={<AdminLandingTestimonialFormPage />} />
          <Route path="contact-us" element={<AdminContactUsPage />} />
          <Route path="contact-us/:id/edit" element={<AdminContactUsFormPage />} />
          <Route
            path="roles-permissions"
            element={
              <ProtectedRoute allowedUserTypes={[UserTypeEnum.SUPER_ADMIN]}>
                <AdminRolesPermissionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="roles-permissions/roles/new"
            element={
              <ProtectedRoute allowedUserTypes={[UserTypeEnum.SUPER_ADMIN]}>
                <AdminRoleFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="roles-permissions/roles/:id/edit"
            element={
              <ProtectedRoute allowedUserTypes={[UserTypeEnum.SUPER_ADMIN]}>
                <AdminRoleFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="roles-permissions/permissions/new"
            element={
              <ProtectedRoute allowedUserTypes={[UserTypeEnum.SUPER_ADMIN]}>
                <AdminPermissionFormPage />
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
          <Route
            path="nav-links"
            element={
              <ProtectedRoute allowedUserTypes={[UserTypeEnum.SUPER_ADMIN]}>
                <AdminNavLinksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="nav-links/new"
            element={
              <ProtectedRoute allowedUserTypes={[UserTypeEnum.SUPER_ADMIN]}>
                <AdminNavLinkFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="nav-links/:id/edit"
            element={
              <ProtectedRoute allowedUserTypes={[UserTypeEnum.SUPER_ADMIN]}>
                <AdminNavLinkFormPage />
              </ProtectedRoute>
            }
          />
          <Route path="messages" element={<AdminMessagesPage />} />
          <Route path="settings" element={<AccountSettingsPage />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AdminRoutes;
