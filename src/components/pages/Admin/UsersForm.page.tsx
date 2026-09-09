import React, { useCallback, useEffect, useState } from "react";
import PeopleIcon from "@mui/icons-material/People";
import CrudFormPage from "../../templates/Shared/CrudFormPage.template";
import { useUserService, type UserResponse } from "../../../services/useUserService";
import { useRoleService } from "../../../services/useRoleService";
import { usePermissionService } from "../../../services/usePermissionService";
import { UserTypeEnum, UserStatusEnum, enumToOptions } from "../../../utils/enums";
import { distinctModuleLabels } from "../../../utils/permissionModules";

const NO_RESTRICTION_VALUE = "";

// Add/Edit page for the Users module — see Users.page.tsx for the listing this
// navigates back to (basePath="/admin/users").
const AdminUserFormPage: React.FC = () => {
  const userService = useUserService();
  const roleService = useRoleService();
  const permissionService = usePermissionService();
  const [roleOptions, setRoleOptions] = useState<{ value: string | number; label: string }[]>([]);

  useEffect(() => {
    roleService
      .getAll()
      .then(async (roles) => {
        // Each option's label spells out exactly what that role grants (e.g. "Bookings
        // Coordinator — Bookings, Services, Medical Records") — assigning a restricted role
        // should never be a guess from the name alone. One getByRole call per role; the
        // roster is small (a handful of custom roles), so this stays cheap.
        const withSummaries = await Promise.all(
          roles.map(async (r) => {
            try {
              const rp = await permissionService.getByRole(r.id);
              const modules = distinctModuleLabels(rp.permissions.map((p) => p.name));
              return { value: r.id, label: modules.length > 0 ? `${r.name} — ${modules.join(", ")}` : `${r.name} (no permissions granted)` };
            } catch {
              return { value: r.id, label: r.name };
            }
          })
        );
        setRoleOptions([{ value: NO_RESTRICTION_VALUE, label: "No restriction (full admin access)" }, ...withSummaries]);
      })
      .catch(() => {
        // GET /roles is hasRole('SUPER_ADMIN') on the backend — a plain ADMIN gets a 403
        // here. Custom roles are a super-admin-only concept anyway, so a plain admin simply
        // sees no restricted-role options instead of an unhandled rejection.
        setRoleOptions([{ value: NO_RESTRICTION_VALUE, label: "No restriction (full admin access)" }]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getById = useCallback((id: string) => userService.getById(Number(id)), [userService]);

  return (
    <CrudFormPage<UserResponse>
      entityLabel="user"
      icon={<PeopleIcon color="primary" />}
      backPath="/admin/users"
      getById={getById}
      toFormValues={(r) => ({ status: r.status, roleId: r.roleId ?? "" })}
      fields={[
        { name: "fullName", label: "Full Name", required: true, gridSize: 6, hideOnEdit: true, section: "Account Details" },
        { name: "email", label: "Email", required: true, gridSize: 6, hideOnEdit: true, section: "Account Details" },
        { name: "phone", label: "Phone", gridSize: 6, hideOnEdit: true, section: "Account Details" },
        { name: "password", label: "Password", gridSize: 6, hideOnEdit: true, section: "Account Details" },
        { name: "userType", label: "User Type", type: "select", required: true, gridSize: 6, options: enumToOptions(UserTypeEnum), hideOnEdit: true, section: "Access & Role" },
        {
          name: "roleId",
          label: "Role",
          type: "select",
          gridSize: 6,
          options: roleOptions,
          section: "Access & Role",
          helperText: "Only applies to Admin accounts — restricts them to the modules a role grants instead of full admin access.",
        },
        { name: "status", label: "Status", type: "select", gridSize: 6, options: enumToOptions(UserStatusEnum), hideOnCreate: true, section: "Access & Role" },
      ]}
      onCreate={async (values) => {
        await userService.create({
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          password: values.password,
          userType: values.userType,
          roleId: values.roleId || null,
        });
      }}
      onUpdate={async (row, values) => {
        if (values.status && values.status !== row.status) {
          await userService.updateStatus(row.id, values.status);
        }
        // "" (the "No restriction" option) means roleId = null — an explicit choice to
        // clear a restricted admin back to full access, not just "field left blank".
        const nextRoleId = values.roleId === NO_RESTRICTION_VALUE || values.roleId == null ? null : Number(values.roleId);
        const previousRoleId = row.roleId ?? null;
        if (nextRoleId !== previousRoleId) {
          await userService.assignRole(row.id, nextRoleId);
        }
      }}
    />
  );
};

export default AdminUserFormPage;
