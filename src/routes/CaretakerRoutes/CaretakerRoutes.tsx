import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import Loader from "../../components/atoms/Loader/Loader";
import { useSidebarNavItems } from "../../hooks/useSidebarNavItems";

// Lazy per-page chunks — see AdminRoutes.tsx for rationale.
const CaretakerDashboardPage = lazy(() => import("../../components/pages/Caretaker/Dashboard/Dashboard.page"));
const CaretakerMyProfilePage = lazy(() => import("../../components/pages/Caretaker/MyProfile/MyProfile.page"));
const CaretakerBookingsPage = lazy(() => import("../../components/pages/Caretaker/Bookings/Bookings.page"));
const CaretakerReviewsPage = lazy(() => import("../../components/pages/Caretaker/Reviews/Reviews.page"));
const NotificationsPage = lazy(() => import("../../components/pages/Shared/Notifications.page"));
const MessagesPage = lazy(() => import("../../components/pages/Shared/Messages.page"));
const AccountSettingsPage = lazy(() => import("../../components/pages/Shared/AccountSettings.page"));

const CaretakerRoutes: React.FC = () => {
  const { navItems, loading } = useSidebarNavItems();
  if (loading) return <Loader minHeight="100vh" />;

  return (
    <Suspense fallback={<Loader minHeight="60vh" />}>
      <Routes>
        <Route element={<DashboardLayout navItems={navItems} roleLabel="Caretaker" settingsPath="/caretaker/settings" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CaretakerDashboardPage />} />
          <Route path="profile" element={<CaretakerMyProfilePage />} />
          <Route path="bookings" element={<CaretakerBookingsPage />} />
          <Route path="reviews" element={<CaretakerReviewsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<AccountSettingsPage />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default CaretakerRoutes;
