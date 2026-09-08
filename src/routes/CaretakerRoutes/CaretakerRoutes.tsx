import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BadgeIcon from "@mui/icons-material/Badge";
import EventNoteIcon from "@mui/icons-material/EventNote";
import RateReviewIcon from "@mui/icons-material/RateReview";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SettingsIcon from "@mui/icons-material/Settings";
import DashboardLayout from "../../layouts/DashboardLayout";
import Loader from "../../components/atoms/Loader/Loader";
import type { SidebarNavItem } from "../../components/molecules/Sidebar/Sidebar";

// Lazy per-page chunks — see AdminRoutes.tsx for rationale.
const CaretakerDashboardPage = lazy(() => import("../../components/pages/Caretaker/Dashboard/Dashboard.page"));
const CaretakerMyProfilePage = lazy(() => import("../../components/pages/Caretaker/MyProfile/MyProfile.page"));
const CaretakerBookingsPage = lazy(() => import("../../components/pages/Caretaker/Bookings/Bookings.page"));
const CaretakerReviewsPage = lazy(() => import("../../components/pages/Caretaker/Reviews/Reviews.page"));
const NotificationsPage = lazy(() => import("../../components/pages/Shared/Notifications.page"));
const MessagesPage = lazy(() => import("../../components/pages/Shared/Messages.page"));
const AccountSettingsPage = lazy(() => import("../../components/pages/Shared/AccountSettings.page"));

const NAV_ITEMS: SidebarNavItem[] = [
  { label: "Dashboard", path: "/caretaker/dashboard", icon: <DashboardIcon /> },
  { label: "My Profile", path: "/caretaker/profile", icon: <BadgeIcon /> },
  { label: "Bookings", path: "/caretaker/bookings", icon: <EventNoteIcon /> },
  { label: "Reviews", path: "/caretaker/reviews", icon: <RateReviewIcon /> },
  { label: "Messages", path: "/caretaker/messages", icon: <ChatBubbleOutlineIcon /> },
  { label: "Notifications", path: "/caretaker/notifications", icon: <NotificationsIcon /> },
  { label: "Settings", path: "/caretaker/settings", icon: <SettingsIcon /> },
];

const CaretakerRoutes: React.FC = () => (
  <Suspense fallback={<Loader minHeight="60vh" />}>
    <Routes>
      <Route element={<DashboardLayout navItems={NAV_ITEMS} roleLabel="Caretaker" settingsPath="/caretaker/settings" />}>
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

export default CaretakerRoutes;
