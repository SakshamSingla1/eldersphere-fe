import React, { useCallback, useEffect, useState } from "react";
import PeopleIcon from "@mui/icons-material/People";
import ShieldIcon from "@mui/icons-material/Shield";
import { Chip, Stack } from "@mui/material";
import CrudModule from "../../templates/Shared/CrudModule.template";
import type { TableColumn } from "../../organisms/Table/TableV1";
import Select from "../../atoms/Select/Select";
import Button from "../../atoms/Button/Button";
import ConfirmDialog from "../../molecules/ConfirmDialog/ConfirmDialog";
import StatusChip from "../../atoms/Chip/StatusChip";
import { USER_ACCOUNT_STATUS_TONE } from "../../atoms/Chip/statusTones";
import ManageUserRolesDialog, { type ManageUserRolesTarget } from "../../molecules/ManageUserRolesDialog/ManageUserRolesDialog";
import { useUserService, type UserResponse } from "../../../services/useUserService";
import { useRoleService } from "../../../services/useRoleService";
import { usePermissionService } from "../../../services/usePermissionService";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { useAuthenticatedUser } from "../../../hooks/useAuthenticatedUser";
import { UserTypeEnum, UserStatusEnum, USER_TYPE_LABEL, enumToOptions } from "../../../utils/enums";
import { getErrorMessage } from "../../../utils/helper";
import { distinctModuleLabels } from "../../../utils/permissionModules";

const NO_RESTRICTION_VALUE = "";

const AdminUsersPage: React.FC = () => {
  const userService = useUserService();
  const roleService = useRoleService();
  const permissionService = usePermissionService();
  const { showSnackbar } = useSnackbar();
  const { user: currentUser } = useAuthenticatedUser();
  const callerIsSuperAdmin = currentUser?.userType === UserTypeEnum.SUPER_ADMIN;
  const [userTypeFilter, setUserTypeFilter] = useState("");
  const [roleOptions, setRoleOptions] = useState<{ value: string | number; label: string }[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  // Base-roles (multi-role) management dialog — separate control from the fine-grained
  // RBAC "Role" field already in the edit form below (roleId/roleName), see
  // ManageUserRolesDialog's own comment for that distinction.
  const [rolesTarget, setRolesTarget] = useState<ManageUserRolesTarget | null>(null);
  const [rolesReload, setRolesReload] = useState<(() => void) | null>(null);
  // Bulk delete bypasses CrudModule's own per-row delete confirmation (it's a custom
  // bulkActions render prop), so it needs its own "are you sure" — deleting several
  // accounts at once with no confirmation was a gap the per-row Delete didn't have.
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<{ rows: UserResponse[]; reload: () => void; clearSelection: () => void } | null>(null);

  const handleBulkDelete = async () => {
    if (bulkDeleting || !bulkDeleteTarget) return;
    setBulkDeleting(true);
    try {
      await Promise.all(bulkDeleteTarget.rows.map((r) => userService.remove(r.id)));
      showSnackbar("success", `${bulkDeleteTarget.rows.length} user(s) deleted successfully`);
      bulkDeleteTarget.clearSelection();
      bulkDeleteTarget.reload();
      setBulkDeleteTarget(null);
    } catch (error) {
      showSnackbar("error", getErrorMessage(error, "Failed to delete some users"));
    } finally {
      setBulkDeleting(false);
    }
  };

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
        // GET /roles is hasRole('SUPER_ADMIN') on the backend (see AdminRoutes.tsx's note on
        // the same split) — a plain ADMIN gets a 403 here. Custom roles are a super-admin-only
        // concept anyway, so a plain admin simply sees no restricted-role options instead of
        // an unhandled rejection and a silently-empty dropdown.
        setRoleOptions([{ value: NO_RESTRICTION_VALUE, label: "No restriction (full admin access)" }]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: TableColumn<UserResponse>[] = [
    { key: "fullName", label: "Name", render: (r) => r.fullName, sortAccessor: (r) => r.fullName.toLowerCase() },
    { key: "email", label: "Email", render: (r) => r.email, sortAccessor: (r) => r.email.toLowerCase() },
    { key: "phone", label: "Phone", render: (r) => r.phone || "—" },
    { key: "userType", label: "Primary Type", render: (r) => r.userType, sortAccessor: (r) => r.userType },
    {
      key: "roles",
      label: "Base Roles",
      render: (r) => {
        const heldRoles = r.roles && r.roles.length > 0 ? r.roles : [r.userType];
        return (
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {heldRoles.map((role) => (
              <Chip
                key={role}
                label={USER_TYPE_LABEL[role]}
                size="small"
                color={role === r.userType ? "primary" : "default"}
                variant={role === r.userType ? "filled" : "outlined"}
                sx={{ fontWeight: role === r.userType ? 700 : 500 }}
              />
            ))}
          </Stack>
        );
      },
    },
    { key: "role", label: "Permission Role", render: (r) => r.roleName || "—" },
    { key: "status", label: "Status", render: (r) => <StatusChip label={r.status} tone={USER_ACCOUNT_STATUS_TONE[r.status]} />, sortAccessor: (r) => r.status },
  ];

  const fetchPage = useCallback(
    (page: number, size: number, search: string) =>
      userService.list({ search: search || undefined, userType: (userTypeFilter || undefined) as any, page, size }),
    [userService, userTypeFilter]
  );

  return (
    <>
    <CrudModule<UserResponse>
      title="Users"
      description="Everyone with an ElderSphere account — family members, caretakers and admins."
      icon={<PeopleIcon color="primary" />}
      columns={columns}
      getRowId={(r) => r.id}
      fetchPage={fetchPage}
      entityLabel="user"
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
      extraToolbarContent={
        <Select
          label="User Type"
          sx={{ minWidth: 180 }}
          placeholder="All types"
          value={userTypeFilter}
          options={enumToOptions(UserTypeEnum)}
          onChange={(e) => setUserTypeFilter(e.target.value)}
        />
      }
      activeFilters={
        userTypeFilter
          ? [
              {
                key: "userType",
                label: `Type: ${enumToOptions(UserTypeEnum).find((o) => o.value === userTypeFilter)?.label ?? userTypeFilter}`,
                onRemove: () => setUserTypeFilter(""),
              },
            ]
          : []
      }
      onClearFilters={() => setUserTypeFilter("")}
      selectable
      extraRowActions={(row, reload) => (
        <Button
          variant="text"
          size="small"
          startIcon={<ShieldIcon fontSize="small" />}
          onClick={(e) => {
            e.stopPropagation();
            setRolesTarget({
              id: row.id,
              fullName: row.fullName,
              roles: row.roles && row.roles.length > 0 ? row.roles : [row.userType],
              primaryRole: row.userType,
            });
            setRolesReload(() => reload);
          }}
        >
          Manage Roles
        </Button>
      )}
      bulkActions={(selectedRows, reload, clearSelection) => (
        <Button
          variant="text"
          size="small"
          color="error"
          disabled={bulkDeleting}
          onClick={() => setBulkDeleteTarget({ rows: selectedRows, reload, clearSelection })}
        >
          Delete selected
        </Button>
      )}
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
      onDelete={async (row) => {
        await userService.remove(row.id);
      }}
    />
    <ConfirmDialog
        open={Boolean(bulkDeleteTarget)}
        title="Delete selected users"
        message={
          bulkDeleteTarget
            ? `This will permanently delete ${bulkDeleteTarget.rows.length} user account${bulkDeleteTarget.rows.length === 1 ? "" : "s"}. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete Selected"
        danger
        loading={bulkDeleting}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteTarget(null)}
      />
      <ManageUserRolesDialog
        open={Boolean(rolesTarget)}
        target={rolesTarget}
        callerIsSuperAdmin={callerIsSuperAdmin}
        onClose={() => {
          setRolesTarget(null);
          rolesReload?.();
        }}
        onGrant={async (roleType) => {
          const result = await userService.grantRole(rolesTarget!.id, roleType);
          showSnackbar("success", `${USER_TYPE_LABEL[roleType]} granted successfully`);
          return result;
        }}
        onRevoke={async (roleType) => {
          const result = await userService.revokeRole(rolesTarget!.id, roleType);
          showSnackbar("success", `${USER_TYPE_LABEL[roleType]} revoked successfully`);
          return result;
        }}
      />
    </>
  );
};

export default AdminUsersPage;
