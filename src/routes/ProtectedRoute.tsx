import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthenticatedUser } from "../hooks/useAuthenticatedUser";
import type { UserTypeEnum } from "../utils/enums";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserTypes?: UserTypeEnum[];
}

// Guards an authenticated route group: redirects to /login when there's no session,
// and — when `allowedUserTypes` is supplied — redirects a logged-in user of the wrong
// role back to their own home (role-aware guard, same spirit as the reference's
// PermissionGuard but keyed off userType rather than fine-grained RBAC permissions).
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedUserTypes }) => {
  const { user } = useAuthenticatedUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedUserTypes && !allowedUserTypes.includes(user.userType)) {
    return <Navigate to={homePathForUser(user.userType)} replace />;
  }

  return <>{children}</>;
};

export const homePathForUser = (userType: UserTypeEnum): string => {
  switch (userType) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return "/admin/dashboard";
    case "CARETAKER":
      return "/caretaker/dashboard";
    case "ELDER":
      return "/elder/dashboard";
    case "FAMILY_MEMBER":
    default:
      return "/family/dashboard";
  }
};

// The dedicated login page for a given role — see App.tsx for the route table. Every role
// now has its own portal (/login/family, /login/caretaker, /login/elder, /admin/login,
// /login/super-admin); the plain /login picker links to each of these, and this is also
// what Register.page.tsx sends a freshly-registered user to.
export const loginPathForUserType = (userType: UserTypeEnum): string => {
  switch (userType) {
    case "SUPER_ADMIN":
      return "/login/super-admin";
    case "ADMIN":
      return "/admin/login";
    case "CARETAKER":
      return "/login/caretaker";
    case "ELDER":
      return "/login/elder";
    case "FAMILY_MEMBER":
    default:
      return "/login/family";
  }
};

export default ProtectedRoute;
