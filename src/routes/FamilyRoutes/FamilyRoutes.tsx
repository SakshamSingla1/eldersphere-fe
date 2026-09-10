import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import Loader from "../../components/atoms/Loader/Loader";
import { useSidebarNavItems } from "../../hooks/useSidebarNavItems";

// Lazy per-page chunks — see AdminRoutes.tsx for rationale.
const FamilyDashboardPage = lazy(() => import("../../components/pages/Family/Dashboard/Dashboard.page"));
const ElderProfilesPage = lazy(() => import("../../components/pages/Family/ElderProfiles/ElderProfiles.page"));
const ElderProfilesFormPage = lazy(() => import("../../components/pages/Family/ElderProfiles/ElderProfilesForm.page"));
const LinkElderProfilePage = lazy(() => import("../../components/pages/Family/ElderProfiles/LinkElderProfile.page"));
const FamilyInvitesPage = lazy(() => import("../../components/pages/Family/Invites/Invites.page"));
const CaretakerSearchPage = lazy(() => import("../../components/pages/Family/CaretakerSearch/CaretakerSearch.page"));
const CaretakerProfileViewPage = lazy(() => import("../../components/pages/Family/CaretakerSearch/CaretakerProfileView.page"));
const FavoritesPage = lazy(() => import("../../components/pages/Family/Favorites/Favorites.page"));
const FamilyBookingsPage = lazy(() => import("../../components/pages/Family/Bookings/Bookings.page"));
const BookingDetailPage = lazy(() => import("../../components/pages/Family/Bookings/BookingDetail.page"));
const FamilyMedicalRecordsPage = lazy(() => import("../../components/pages/Family/MedicalRecords/MedicalRecords.page"));
const FamilyMedicalRecordFormPage = lazy(() => import("../../components/pages/Family/MedicalRecords/MedicalRecordsForm.page"));
const MedicalRecordDetailPage = lazy(() => import("../../components/pages/Family/MedicalRecords/MedicalRecordDetail.page"));
const FamilyReviewsPage = lazy(() => import("../../components/pages/Family/Reviews/Reviews.page"));
const FamilyEmergencyPage = lazy(() => import("../../components/pages/Family/Emergency/Emergency.page"));
const NotificationsPage = lazy(() => import("../../components/pages/Shared/Notifications.page"));
const MessagesPage = lazy(() => import("../../components/pages/Shared/Messages.page"));
const AccountSettingsPage = lazy(() => import("../../components/pages/Shared/AccountSettings.page"));

const FamilyRoutes: React.FC = () => {
  const { navItems, loading } = useSidebarNavItems();
  if (loading) return <Loader minHeight="100vh" />;

  return (
    <Suspense fallback={<Loader minHeight="60vh" />}>
      <Routes>
        <Route element={<DashboardLayout navItems={navItems} roleLabel="Family" settingsPath="/family/settings" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<FamilyDashboardPage />} />
          <Route path="elder-profiles" element={<ElderProfilesPage />} />
          <Route path="elder-profiles/new" element={<ElderProfilesFormPage />} />
          <Route path="elder-profiles/:id/edit" element={<ElderProfilesFormPage />} />
          <Route path="elder-profiles/link" element={<LinkElderProfilePage />} />
          <Route path="invites" element={<FamilyInvitesPage />} />
          <Route path="caretakers" element={<CaretakerSearchPage />} />
          <Route path="caretakers/:id" element={<CaretakerProfileViewPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="bookings" element={<FamilyBookingsPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />
          <Route path="medical-records" element={<FamilyMedicalRecordsPage />} />
          <Route path="medical-records/new" element={<FamilyMedicalRecordFormPage />} />
          <Route path="medical-records/:id" element={<MedicalRecordDetailPage />} />
          <Route path="reviews" element={<FamilyReviewsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="emergency" element={<FamilyEmergencyPage />} />
          <Route path="settings" element={<AccountSettingsPage />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default FamilyRoutes;
