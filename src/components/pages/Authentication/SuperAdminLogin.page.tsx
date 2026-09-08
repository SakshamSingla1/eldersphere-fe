import React from "react";
import RoleLoginPage from "./RoleLoginPage";
import { UserTypeEnum } from "../../../utils/enums";

// SUPER_ADMIN's own dedicated portal. SUPER_ADMIN used to share /admin/login with ADMIN;
// now that it has this page, /admin/login has been narrowed to ADMIN-only (see
// AdminLogin.page.tsx) for consistency with "every role has its own page" — a SUPER_ADMIN
// account is never left without a place to log in since this page exists.
const SuperAdminLoginPage: React.FC = () => (
  <RoleLoginPage
    allowedUserType={UserTypeEnum.SUPER_ADMIN}
    variant="super-admin"
    title="Super Admin Access"
    subtitle="Sign in with your super administrator credentials."
    roleLabel="super administrator"
    showSignup={false}
  />
);

export default SuperAdminLoginPage;
