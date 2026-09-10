import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import Loader from "../../components/atoms/Loader/Loader";
import { useSidebarNavItems } from "../../hooks/useSidebarNavItems";

// Lazy per-page chunks — see AdminRoutes.tsx for rationale.
const ElderDashboardPage = lazy(() => import("../../components/pages/Elder/Dashboard/Dashboard.page"));
const ElderMyProfilePage = lazy(() => import("../../components/pages/Elder/MyProfile/MyProfile.page"));
const ElderBookingsPage = lazy(() => import("../../components/pages/Elder/Bookings/Bookings.page"));
const ElderMedicalRecordsPage = lazy(() => import("../../components/pages/Elder/MedicalRecords/MedicalRecords.page"));
const ElderEmergencyPage = lazy(() => import("../../components/pages/Elder/Emergency/Emergency.page"));
const ElderInvitesPage = lazy(() => import("../../components/pages/Elder/Invites/Invites.page"));
const NotificationsPage = lazy(() => import("../../components/pages/Shared/Notifications.page"));
const MessagesPage = lazy(() => import("../../components/pages/Shared/Messages.page"));
const AccountSettingsPage = lazy(() => import("../../components/pages/Shared/AccountSettings.page"));

const ElderRoutes: React.FC = () => {
  const { navItems, loading } = useSidebarNavItems();
  if (loading) return <Loader minHeight="100vh" />;

  return (
    <Suspense fallback={<Loader minHeight="60vh" />}>
      <Routes>
        <Route element={<DashboardLayout navItems={navItems} roleLabel="Elder" settingsPath="/elder/settings" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ElderDashboardPage />} />
          <Route path="profile" element={<ElderMyProfilePage />} />
          <Route path="bookings" element={<ElderBookingsPage />} />
          <Route path="medical-records" element={<ElderMedicalRecordsPage />} />
          <Route path="invites" element={<ElderInvitesPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="emergency" element={<ElderEmergencyPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<AccountSettingsPage />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default ElderRoutes;
