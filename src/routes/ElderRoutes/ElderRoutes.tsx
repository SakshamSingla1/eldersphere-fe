import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import EventNoteIcon from "@mui/icons-material/EventNote";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SettingsIcon from "@mui/icons-material/Settings";
import DashboardLayout from "../../layouts/DashboardLayout";
import Loader from "../../components/atoms/Loader/Loader";
import type { SidebarNavItem } from "../../components/molecules/Sidebar/Sidebar";

// Lazy per-page chunks — see AdminRoutes.tsx for rationale.
const ElderDashboardPage = lazy(() => import("../../components/pages/Elder/Dashboard/Dashboard.page"));
const ElderMyProfilePage = lazy(() => import("../../components/pages/Elder/MyProfile/MyProfile.page"));
const ElderBookingsPage = lazy(() => import("../../components/pages/Elder/Bookings/Bookings.page"));
const ElderMedicalRecordsPage = lazy(() => import("../../components/pages/Elder/MedicalRecords/MedicalRecords.page"));
const ElderEmergencyPage = lazy(() => import("../../components/pages/Elder/Emergency/Emergency.page"));
const NotificationsPage = lazy(() => import("../../components/pages/Shared/Notifications.page"));
const MessagesPage = lazy(() => import("../../components/pages/Shared/Messages.page"));
const AccountSettingsPage = lazy(() => import("../../components/pages/Shared/AccountSettings.page"));

const NAV_ITEMS: SidebarNavItem[] = [
  { label: "Dashboard", path: "/elder/dashboard", icon: <DashboardIcon /> },
  { label: "My Profile", path: "/elder/profile", icon: <PersonIcon /> },
  { label: "My Bookings", path: "/elder/bookings", icon: <EventNoteIcon /> },
  { label: "Medical Records", path: "/elder/medical-records", icon: <FolderSharedIcon /> },
  { label: "Messages", path: "/elder/messages", icon: <ChatBubbleOutlineIcon /> },
  { label: "Emergency", path: "/elder/emergency", icon: <WarningAmberIcon /> },
  { label: "Notifications", path: "/elder/notifications", icon: <NotificationsIcon /> },
  { label: "Settings", path: "/elder/settings", icon: <SettingsIcon /> },
];

const ElderRoutes: React.FC = () => (
  <Suspense fallback={<Loader minHeight="60vh" />}>
    <Routes>
      <Route element={<DashboardLayout navItems={NAV_ITEMS} roleLabel="Elder" settingsPath="/elder/settings" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ElderDashboardPage />} />
        <Route path="profile" element={<ElderMyProfilePage />} />
        <Route path="bookings" element={<ElderBookingsPage />} />
        <Route path="medical-records" element={<ElderMedicalRecordsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="emergency" element={<ElderEmergencyPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<AccountSettingsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  </Suspense>
);

export default ElderRoutes;
