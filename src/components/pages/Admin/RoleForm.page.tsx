import React, { useCallback } from "react";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CrudFormPage from "../../templates/Shared/CrudFormPage.template";
import { useRoleService, type RoleResponseDTO } from "../../../services/useRoleService";
import { RoleStatusEnum, enumToOptions } from "../../../utils/enums";

// Add/Edit page for the Roles sub-resource of Roles & Permissions — see
// RolesPermissions.page.tsx's Roles tab for the listing this navigates back to
// (basePath="/admin/roles-permissions/roles", backPath restores the "Roles" tab).
const AdminRoleFormPage: React.FC = () => {
  const roleService = useRoleService();

  const getById = useCallback((id: string) => roleService.getById(Number(id)), [roleService]);

  return (
    <CrudFormPage<RoleResponseDTO>
      entityLabel="role"
      entityLabelPlural="roles"
      icon={<AdminPanelSettingsIcon color="primary" />}
      backPath="/admin/roles-permissions?tab=roles"
      getById={getById}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "description", label: "Description", type: "textarea" },
        { name: "status", label: "Status", type: "select", options: enumToOptions(RoleStatusEnum) },
      ]}
      onCreate={async (values) => {
        await roleService.create(values as any);
      }}
      onUpdate={async (row, values) => {
        await roleService.update(row.id, values as any);
      }}
    />
  );
};

export default AdminRoleFormPage;
