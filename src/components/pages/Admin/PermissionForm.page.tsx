import React from "react";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CrudFormPage from "../../templates/Shared/CrudFormPage.template";
import { usePermissionService } from "../../../services/usePermissionService";

// Add page for the Permissions sub-resource of Roles & Permissions — create-only (there's
// no PUT /permissions/{id} on the backend, so this module never had an Edit action; see
// RolesPermissions.page.tsx's Permissions tab for the listing this navigates back to).
const AdminPermissionFormPage: React.FC = () => {
  const permissionService = usePermissionService();

  return (
    <CrudFormPage
      entityLabel="permission"
      entityLabelPlural="permissions"
      icon={<AdminPanelSettingsIcon color="primary" />}
      backPath="/admin/roles-permissions?tab=permissions"
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "description", label: "Description", type: "textarea" },
      ]}
      onCreate={async (values) => {
        await permissionService.create(values as any);
      }}
    />
  );
};

export default AdminPermissionFormPage;
