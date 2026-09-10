import React, { useCallback } from "react";
import ListAltIcon from "@mui/icons-material/ListAlt";
import CrudFormPage from "../../templates/Shared/CrudFormPage.template";
import { useNavLinkService, type NavLinkResponse } from "../../../services/useNavLinkService";
import { USER_TYPE_LABEL, UserTypeEnum, NavLinkStatusEnum, enumToOptions } from "../../../utils/enums";
import { NAV_ICON_NAMES } from "../../../utils/navIcons";

// Add/Edit page for the Navigation Links module — see NavLinks.page.tsx for the listing
// this navigates back to (basePath="/admin/nav-links").
const AdminNavLinkFormPage: React.FC = () => {
  const navLinkService = useNavLinkService();

  const getById = useCallback((id: string) => navLinkService.getById(Number(id)), [navLinkService]);

  return (
    <CrudFormPage<NavLinkResponse>
      entityLabel="navigation link"
      icon={<ListAltIcon color="primary" />}
      backPath="/admin/nav-links"
      getById={getById}
      fields={[
        { name: "userType", label: "Portal", type: "select", required: true, options: enumToOptions(UserTypeEnum, USER_TYPE_LABEL) },
        { name: "navGroup", label: "Group (optional)", gridSize: 6 },
        { name: "navIndex", label: "Order", type: "number", required: true, gridSize: 6 },
        { name: "name", label: "Name", required: true },
        { name: "path", label: "Path", required: true, helperText: "e.g. /admin/dashboard" },
        { name: "icon", label: "Icon", type: "select", options: NAV_ICON_NAMES.map((n) => ({ value: n, label: n })) },
        {
          name: "requiredPermission",
          label: "Required Permission (optional)",
          helperText: "An ADMIN's assigned role must hold this permission (see Roles & Permissions) to see this item. Leave blank for no gate.",
        },
        { name: "superAdminOnly", label: "Super Admin only", type: "checkbox" },
        { name: "status", label: "Status", type: "select", required: true, options: enumToOptions(NavLinkStatusEnum) },
      ]}
      onCreate={async (values) => {
        await navLinkService.create(values as any);
      }}
      onUpdate={async (row, values) => {
        await navLinkService.update(row.id, values as any);
      }}
    />
  );
};

export default AdminNavLinkFormPage;
