import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Tabs, Tab, Card, CardContent, Stack, Typography, Checkbox as MuiCheckbox, FormControlLabel, Chip, Divider } from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PageHeader from "../../molecules/PageHeader/PageHeader";
import CrudModule from "../../templates/Shared/CrudModule.template";
import type { TableColumn } from "../../organisms/Table/TableV1";
import Select from "../../atoms/Select/Select";
import { useRoleService, type RoleResponseDTO } from "../../../services/useRoleService";
import { usePermissionService, type PermissionResponseDTO } from "../../../services/usePermissionService";
import { paginateClientSide } from "../../../utils/helper";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { getErrorMessage } from "../../../utils/helper";
import { groupPermissionsByModule } from "../../../utils/permissionModules";

const TAB_KEYS = ["roles", "permissions", "assignment"] as const;

interface RoleRow extends RoleResponseDTO {
  /** null while still loading, so the column can show "…" instead of a misleading 0. */
  permissionCount?: number;
}

const RolesTab: React.FC = () => {
  const roleService = useRoleService();
  const permissionService = usePermissionService();

  const columns: TableColumn<RoleRow>[] = [
    { key: "name", label: "Name", render: (r) => r.name },
    { key: "description", label: "Description", render: (r) => r.description || "—" },
    {
      key: "permissionCount",
      label: "Permissions",
      render: (r) => (r.permissionCount === null ? "…" : <Chip size="small" label={`${r.permissionCount} granted`} />),
    },
    { key: "status", label: "Status", render: (r) => r.status },
  ];

  const fetchPage = useCallback(
    async (page: number, size: number, search: string) => {
      const all = await roleService.getAll();
      const result = paginateClientSide<RoleRow>(all, page, size, search, (item, s) => item.name.toLowerCase().includes(s));
      // Enrich just the rows actually shown on this page with their permission count —
      // there's no "roles with permission counts" list endpoint, so this is one
      // getByRole call per visible row rather than N+1 across every role that exists.
      const counted = await Promise.all(
        result.content.map(async (row) => {
          try {
            const rp = await permissionService.getByRole(row.id);
            return { ...row, permissionCount: rp.permissions.length };
          } catch {
            return { ...row, permissionCount: 0 };
          }
        })
      );
      return { ...result, content: counted };
    },
    [roleService, permissionService]
  );

  return (
    <CrudModule<RoleRow>
      title="Roles"
      description="Custom admin roles — each scopes an admin account to only the permissions assigned below (see the Assign Permissions tab)."
      columns={columns}
      getRowId={(r) => r.id}
      fetchPage={fetchPage}
      entityLabel="role"
      basePath="/admin/roles-permissions/roles"
      extraQuery="tab=roles"
      onCreate={async (values) => {
        await roleService.create(values as any);
      }}
      onUpdate={async (row, values) => {
        await roleService.update(row.id, values as any);
      }}
      onDelete={async (row) => {
        await roleService.remove(row.id);
      }}
    />
  );
};

const PermissionsTab: React.FC = () => {
  const permissionService = usePermissionService();

  const columns: TableColumn<PermissionResponseDTO>[] = [
    { key: "name", label: "Name", render: (r) => r.name },
    { key: "description", label: "Description", render: (r) => r.description || "—" },
  ];

  const fetchPage = useCallback(
    async (page: number, size: number, search: string) => {
      const all = await permissionService.getAll();
      return paginateClientSide(all, page, size, search, (item, s) => item.name.toLowerCase().includes(s));
    },
    [permissionService]
  );

  return (
    <CrudModule<PermissionResponseDTO>
      title="Permissions"
      columns={columns}
      getRowId={(r) => r.id}
      fetchPage={fetchPage}
      entityLabel="permission"
      basePath="/admin/roles-permissions/permissions"
      extraQuery="tab=permissions"
      onCreate={async (values) => {
        await permissionService.create(values as any);
      }}
      onDelete={async (row) => {
        await permissionService.remove(row.id);
      }}
    />
  );
};

const AssignmentTab: React.FC = () => {
  const roleService = useRoleService();
  const permissionService = usePermissionService();
  const { showSnackbar } = useSnackbar();

  const [roles, setRoles] = useState<RoleResponseDTO[]>([]);
  const [permissions, setPermissions] = useState<PermissionResponseDTO[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | "">("");
  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());
  const [busyPermissionId, setBusyPermissionId] = useState<number | null>(null);
  const [busyModuleKey, setBusyModuleKey] = useState<string | null>(null);

  const moduleGroups = useMemo(() => groupPermissionsByModule(permissions), [permissions]);

  useEffect(() => {
    Promise.all([roleService.getAll(), permissionService.getAll()]).then(([r, p]) => {
      setRoles(r);
      setPermissions(p);
      if (r.length > 0) setSelectedRoleId(r[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedRoleId) return;
    permissionService.getByRole(Number(selectedRoleId)).then((res) => {
      setAssignedIds(new Set(res.permissions.map((p) => p.id)));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoleId]);

  const toggle = async (permissionId: number, checked: boolean) => {
    if (!selectedRoleId) return;
    setBusyPermissionId(permissionId);
    try {
      if (checked) {
        await permissionService.assignToRole(Number(selectedRoleId), permissionId);
        setAssignedIds((prev) => new Set(prev).add(permissionId));
      } else {
        await permissionService.revokeFromRole(Number(selectedRoleId), permissionId);
        setAssignedIds((prev) => {
          const next = new Set(prev);
          next.delete(permissionId);
          return next;
        });
      }
    } catch (err) {
      showSnackbar("error", getErrorMessage(err, "Could not update this permission"));
    } finally {
      setBusyPermissionId(null);
    }
  };

  const toggleModule = async (moduleKey: string, modulePermissions: PermissionResponseDTO[], checkAll: boolean) => {
    if (!selectedRoleId) return;
    setBusyModuleKey(moduleKey);
    const toChange = modulePermissions.filter((p) => assignedIds.has(p.id) !== checkAll);
    try {
      await Promise.all(
        toChange.map((p) =>
          checkAll ? permissionService.assignToRole(Number(selectedRoleId), p.id) : permissionService.revokeFromRole(Number(selectedRoleId), p.id)
        )
      );
      setAssignedIds((prev) => {
        const next = new Set(prev);
        toChange.forEach((p) => (checkAll ? next.add(p.id) : next.delete(p.id)));
        return next;
      });
    } catch (err) {
      showSnackbar("error", getErrorMessage(err, `Could not update ${moduleKey.toLowerCase()} permissions`));
    } finally {
      setBusyModuleKey(null);
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Select
            label="Role"
            sx={{ minWidth: 240 }}
            value={selectedRoleId}
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
            onChange={(e) => setSelectedRoleId(Number(e.target.value))}
          />
        </Stack>
        {permissions.length === 0 ? (
          <Typography color="text.secondary">No permissions defined yet.</Typography>
        ) : (
          <Stack spacing={2}>
            {moduleGroups.map((group, idx) => {
              const grantedCount = group.permissions.filter((p) => assignedIds.has(p.id)).length;
              const allGranted = grantedCount === group.permissions.length;
              const someGranted = grantedCount > 0 && !allGranted;
              return (
                <Box key={group.moduleKey}>
                  {idx > 0 && <Divider sx={{ mb: 2 }} />}
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                    <MuiCheckbox
                      size="small"
                      checked={allGranted}
                      indeterminate={someGranted}
                      disabled={busyModuleKey === group.moduleKey}
                      onChange={(e) => toggleModule(group.moduleKey, group.permissions, e.target.checked)}
                    />
                    <Typography variant="subtitle2" fontWeight={700}>
                      {group.moduleLabel}
                    </Typography>
                  </Stack>
                  <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(220px, 1fr))" gap={1} pl={4.5}>
                    {group.permissions.map((p) => (
                      <FormControlLabel
                        key={p.id}
                        control={
                          <MuiCheckbox
                            size="small"
                            checked={assignedIds.has(p.id)}
                            disabled={busyPermissionId === p.id || busyModuleKey === group.moduleKey}
                            onChange={(e) => toggle(p.id, e.target.checked)}
                          />
                        }
                        label={p.name}
                      />
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

const AdminRolesPermissionsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  // Add/Edit navigates away to its own page (see RoleForm.page.tsx / PermissionForm.page.tsx)
  // and back here via `?tab=roles`/`?tab=permissions` (set as CrudModule's `extraQuery`) —
  // read it once on mount so returning from Save/Cancel lands back on the tab the user was
  // actually on, not always the default "Roles" tab.
  const [tab, setTab] = useState(() => {
    const fromUrl = TAB_KEYS.indexOf(searchParams.get("tab") as (typeof TAB_KEYS)[number]);
    return fromUrl >= 0 ? fromUrl : 0;
  });

  return (
    <Box>
      <PageHeader icon={<AdminPanelSettingsIcon color="primary" />} title="Roles & Permissions" />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Roles" />
        <Tab label="Permissions" />
        <Tab label="Assign Permissions" />
      </Tabs>
      {tab === 0 && <RolesTab />}
      {tab === 1 && <PermissionsTab />}
      {tab === 2 && <AssignmentTab />}
    </Box>
  );
};

export default AdminRolesPermissionsPage;
