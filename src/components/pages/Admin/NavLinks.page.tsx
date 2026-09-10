import React, { useCallback, useState } from "react";
import { Chip } from "@mui/material";
import ListAltIcon from "@mui/icons-material/ListAlt";
import CrudModule from "../../templates/Shared/CrudModule.template";
import type { TableColumn } from "../../organisms/Table/TableV1";
import Select from "../../atoms/Select/Select";
import { useNavLinkService, type NavLinkResponse } from "../../../services/useNavLinkService";
import { USER_TYPE_LABEL, UserTypeEnum, enumToOptions } from "../../../utils/enums";

// SUPER_ADMIN-only management of the DB-backed sidebar (see NavLinkController /
// useSidebarNavItems) — add, rename, reorder, hide, or gate any portal's nav items without
// a frontend deploy.
const AdminNavLinksPage: React.FC = () => {
  const navLinkService = useNavLinkService();
  const [userTypeFilter, setUserTypeFilter] = useState("");

  const columns: TableColumn<NavLinkResponse>[] = [
    { key: "userType", label: "Portal", render: (r) => USER_TYPE_LABEL[r.userType] },
    { key: "navGroup", label: "Group", render: (r) => r.navGroup || "—" },
    { key: "navIndex", label: "Order", render: (r) => r.navIndex },
    { key: "name", label: "Name", render: (r) => r.name },
    { key: "path", label: "Path", render: (r) => r.path },
    { key: "icon", label: "Icon", render: (r) => r.icon || "—" },
    { key: "requiredPermission", label: "Required Permission", render: (r) => r.requiredPermission || "—" },
    {
      key: "superAdminOnly",
      label: "Super Admin Only",
      render: (r) => (r.superAdminOnly ? <Chip label="Yes" size="small" color="warning" /> : "—"),
    },
    { key: "status", label: "Status", render: (r) => r.status },
  ];

  const fetchPage = useCallback(
    async (page: number, size: number) => {
      const result = await navLinkService.list(page, size);
      if (!userTypeFilter) return result;
      return { ...result, content: result.content.filter((r) => r.userType === userTypeFilter) };
    },
    [navLinkService, userTypeFilter]
  );

  return (
    <CrudModule<NavLinkResponse>
      title="Navigation Links"
      description="The sidebar items every portal renders — who sees what, in what order, and behind which admin permission."
      icon={<ListAltIcon color="primary" />}
      columns={columns}
      getRowId={(r) => r.id}
      fetchPage={fetchPage}
      searchable={false}
      entityLabel="navigation link"
      basePath="/admin/nav-links"
      extraToolbarContent={
        <Select
          label="Portal"
          sx={{ minWidth: 180 }}
          placeholder="All portals"
          value={userTypeFilter}
          options={enumToOptions(UserTypeEnum, USER_TYPE_LABEL)}
          onChange={(e) => setUserTypeFilter(e.target.value)}
        />
      }
      activeFilters={
        userTypeFilter
          ? [{ key: "userType", label: `Portal: ${USER_TYPE_LABEL[userTypeFilter as UserTypeEnum]}`, onRemove: () => setUserTypeFilter("") }]
          : []
      }
      onClearFilters={() => setUserTypeFilter("")}
      onCreate={async (values) => {
        await navLinkService.create(values as any);
      }}
      onUpdate={async (row, values) => {
        await navLinkService.update(row.id, values as any);
      }}
      onDelete={async (row) => {
        await navLinkService.remove(row.id);
      }}
    />
  );
};

export default AdminNavLinksPage;
