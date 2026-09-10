import React from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import SearchIcon from "@mui/icons-material/Search";
import FavoriteIcon from "@mui/icons-material/Favorite";
import EventNoteIcon from "@mui/icons-material/EventNote";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import RateReviewIcon from "@mui/icons-material/RateReview";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import NotificationsIcon from "@mui/icons-material/Notifications";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SettingsIcon from "@mui/icons-material/Settings";
import BadgeIcon from "@mui/icons-material/Badge";
import PersonIcon from "@mui/icons-material/Person";
import InsightsIcon from "@mui/icons-material/Insights";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import ElderlyIcon from "@mui/icons-material/Elderly";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import WebIcon from "@mui/icons-material/Web";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import TuneIcon from "@mui/icons-material/Tune";
import ListAltIcon from "@mui/icons-material/ListAlt";
import HomeIcon from "@mui/icons-material/Home";

// Maps the plain string a NavLink stores in its `icon` column (see NavLink entity /
// nav_links table) to the actual MUI icon element the Sidebar renders — a DB row can't
// carry JSX, so this is the one place that translation happens. Add an entry here whenever
// a new icon is used by a seeded or admin-created nav link; unknown/blank names fall back
// to a plain home icon rather than rendering nothing.
const NAV_ICON_MAP: Record<string, React.ReactElement> = {
  DashboardIcon: <DashboardIcon />,
  PeopleIcon: <PeopleIcon />,
  MailOutlineIcon: <MailOutlineIcon />,
  SearchIcon: <SearchIcon />,
  FavoriteIcon: <FavoriteIcon />,
  EventNoteIcon: <EventNoteIcon />,
  FolderSharedIcon: <FolderSharedIcon />,
  RateReviewIcon: <RateReviewIcon />,
  ChatBubbleOutlineIcon: <ChatBubbleOutlineIcon />,
  NotificationsIcon: <NotificationsIcon />,
  WarningAmberIcon: <WarningAmberIcon />,
  SettingsIcon: <SettingsIcon />,
  BadgeIcon: <BadgeIcon />,
  PersonIcon: <PersonIcon />,
  InsightsIcon: <InsightsIcon />,
  VerifiedUserIcon: <VerifiedUserIcon />,
  ElderlyIcon: <ElderlyIcon />,
  MedicalServicesIcon: <MedicalServicesIcon />,
  WebIcon: <WebIcon />,
  ContactMailIcon: <ContactMailIcon />,
  AdminPanelSettingsIcon: <AdminPanelSettingsIcon />,
  TuneIcon: <TuneIcon />,
  ListAltIcon: <ListAltIcon />,
};

export const NAV_ICON_NAMES = Object.keys(NAV_ICON_MAP);

export const resolveNavIcon = (iconName: string | null | undefined): React.ReactElement =>
  (iconName && NAV_ICON_MAP[iconName]) || <HomeIcon />;
