import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";
import FavoriteIcon from "@mui/icons-material/Favorite";
import EventNoteIcon from "@mui/icons-material/EventNote";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import RateReviewIcon from "@mui/icons-material/RateReview";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SettingsIcon from "@mui/icons-material/Settings";
import DashboardLayout from "../../layouts/DashboardLayout";
import Loader from "../../components/atoms/Loader/Loader";
import type { SidebarNavItem } from "../../components/molecules/Sidebar/Sidebar";

// Lazy per-page chunks — see AdminRoutes.tsx for rationale.
const FamilyDashboardPage = lazy(() => import("../../components/pages/Family/Dashboard/Dashboard.page"));
const ElderProfilesPage = lazy(() => import("../../components/pages/Family/ElderProfiles/ElderProfiles.page"));
const CaretakerSearchPage = lazy(() => import("../../components/pages/Family/CaretakerSearch/CaretakerSearch.page"));
const CaretakerProfileViewPage = lazy(() => import("../../components/pages/Family/CaretakerSearch/CaretakerProfileView.page"));
const FavoritesPage = lazy(() => import("../../components/pages/Family/Favorites/Favorites.page"));
const FamilyBookingsPage = lazy(() => import("../../components/pages/Family/Bookings/Bookings.page"));
const BookingDetailPage = lazy(() => import("../../components/pages/Family/Bookings/BookingDetail.page"));
const FamilyMedicalRecordsPage = lazy(() => import("../../components/pages/Family/MedicalRecords/MedicalRecords.page"));
const MedicalRecordDetailPage = lazy(() => import("../../components/pages/Family/MedicalRecords/MedicalRecordDetail.page"));
const FamilyReviewsPage = lazy(() => import("../../components/pages/Family/Reviews/Reviews.page"));
const FamilyEmergencyPage = lazy(() => import("../../components/pages/Family/Emergency/Emergency.page"));
const NotificationsPage = lazy(() => import("../../components/pages/Shared/Notifications.page"));
const MessagesPage = lazy(() => import("../../components/pages/Shared/Messages.page"));
const AccountSettingsPage = lazy(() => import("../../components/pages/Shared/AccountSettings.page"));

const NAV_ITEMS: SidebarNavItem[] = [
  { label: "Dashboard", path: "/family/dashboard", icon: <DashboardIcon /> },
  { label: "Elder Profiles", path: "/family/elder-profiles", icon: <PeopleIcon /> },
  { label: "Find a Caretaker", path: "/family/caretakers", icon: <SearchIcon /> },
  { label: "My Favorites", path: "/family/favorites", icon: <FavoriteIcon /> },
  { label: "My Bookings", path: "/family/bookings", icon: <EventNoteIcon /> },
  { label: "Medical Records", path: "/family/medical-records", icon: <FolderSharedIcon /> },
  { label: "Reviews", path: "/family/reviews", icon: <RateReviewIcon /> },
  { label: "Messages", path: "/family/messages", icon: <ChatBubbleOutlineIcon /> },
  { label: "Notifications", path: "/family/notifications", icon: <NotificationsIcon /> },
  { label: "Emergency", path: "/family/emergency", icon: <WarningAmberIcon /> },
  { label: "Settings", path: "/family/settings", icon: <SettingsIcon /> },
];

const FamilyRoutes: React.FC = () => (
  <Suspense fallback={<Loader minHeight="60vh" />}>
    <Routes>
      <Route element={<DashboardLayout navItems={NAV_ITEMS} roleLabel="Family" settingsPath="/family/settings" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<FamilyDashboardPage />} />
        <Route path="elder-profiles" element={<ElderProfilesPage />} />
        <Route path="caretakers" element={<CaretakerSearchPage />} />
        <Route path="caretakers/:id" element={<CaretakerProfileViewPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="bookings" element={<FamilyBookingsPage />} />
        <Route path="bookings/:id" element={<BookingDetailPage />} />
        <Route path="medical-records" element={<FamilyMedicalRecordsPage />} />
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

export default FamilyRoutes;
