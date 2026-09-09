import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stack, IconButton, Tooltip } from "@mui/material";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import ListingShell, { type ActiveFilter } from "./ListingShell.template";
import TableV1, { type TableColumn } from "../../organisms/Table/TableV1";
import ConfirmDialog from "../../molecules/ConfirmDialog/ConfirmDialog";
import { NoSearchResultsIllustration } from "../../atoms/Illustrations/Illustrations";
import { useDebounce, getErrorMessage } from "../../../utils/helper";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import type { PageResponse } from "../../../utils/types";

export interface CrudModuleProps<T> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  columns: TableColumn<T>[];
  getRowId: (row: T) => number | string;
  fetchPage: (page: number, size: number, search: string) => Promise<PageResponse<T>>;
  /**
   * Route prefix for the Add/Edit form pages this module's listing navigates to, e.g.
   * "/admin/services" — "Add" goes to `${basePath}/new`, a row's Edit action goes to
   * `${basePath}/{id}/edit` (see CrudFormPage.template.tsx, rendered at those routes).
   * Required whenever `onCreate` and/or `onUpdate` is passed; a listing-only module (no
   * create/update handlers, so no Add/Edit affordance ever renders) can omit it.
   */
  basePath?: string;
  /**
   * Extra query string (no leading "?"), appended to both the add and edit URLs — lets a
   * module that scopes its listing to something not in the URL (e.g. Admin Medical Records'
   * "look up by elder ID" or Roles & Permissions' tab) hand that context to the form page,
   * which echoes it back in its own `backPath` so Cancel/Save-and-return lands the user back
   * where they were instead of a reset listing. E.g. "elderId=42" or "tab=permissions".
   */
  extraQuery?: string;
  /** Presence gates the "Add {entityLabel}" button — the actual create call now lives on the `${basePath}/new` page, not here. */
  onCreate?: (values: Record<string, any>) => Promise<void>;
  /** Presence gates each row's Edit action — the actual update call now lives on the `${basePath}/{id}/edit` page, not here. */
  onUpdate?: (row: T, values: Record<string, any>) => Promise<void>;
  onDelete?: (row: T) => Promise<void>;
  searchable?: boolean;
  addLabel?: string;
  entityLabel?: string; // used in confirm-delete copy, e.g. "service"
  refreshKey?: number; // bump to force a reload from outside
  extraToolbarContent?: React.ReactNode;
  /** Extra per-row action buttons rendered alongside Edit/Delete (e.g. "Cancel", "Approve"). Call `reload` after a successful action to refresh the list. */
  extraRowActions?: (row: T, reload: () => void) => React.ReactNode;
  hideEditButton?: boolean;
  /** Optional row-click handler (e.g. navigate to a detail view). Independent of the Edit page. */
  onRowClick?: (row: T) => void;
  /**
   * Custom illustration for the "no {entityLabel}s yet" (non-search) empty state — e.g.
   * a medical-records-specific illustration on the medical records module. The
   * "no results match your search" state always uses NoSearchResultsIllustration
   * regardless, since that case is identical in meaning across every module.
   */
  emptyIllustration?: React.ReactNode;
  /** Currently-applied `extraToolbarContent` filters, shown as removable chips — see ListingShell. */
  activeFilters?: ActiveFilter[];
  /** Shown as a "Clear all filters" action whenever `activeFilters` is non-empty. */
  onClearFilters?: () => void;
  /**
   * Opts this module into row-selection checkboxes + a bulk-action bar (reference
   * implementation: Admin Users). Pass `bulkActions` to render the actions available once
   * 1+ rows are selected; call the given `reload` after a successful action to refresh the
   * list (selection is cleared automatically whenever the page/search/pageSize changes).
   */
  selectable?: boolean;
  bulkActions?: (selectedRows: T[], reload: () => void, clearSelection: () => void) => React.ReactNode;
}

// Generic reusable Listing CRUD pattern — every admin module (Users, Services, Elder
// Profiles, Roles, Landing content, ...) wires its columns/service calls into this one
// component instead of re-implementing list state, pagination, search-debounce and
// delete-confirmation each time. Add/Edit are dedicated form PAGES (routed via
// `basePath` + CrudFormPage.template.tsx), not a dialog — only Delete stays a
// quick yes/no ConfirmDialog here.
function CrudModule<T>({
  title,
  description,
  icon,
  columns,
  getRowId,
  fetchPage,
  basePath,
  extraQuery,
  onCreate,
  onUpdate,
  onDelete,
  searchable = true,
  addLabel,
  entityLabel = "record",
  refreshKey,
  extraToolbarContent,
  extraRowActions,
  hideEditButton,
  onRowClick,
  emptyIllustration,
  activeFilters,
  onClearFilters,
  selectable,
  bulkActions,
}: CrudModuleProps<T>) {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [rows, setRows] = useState<T[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchPage(page, pageSize, search);
      setRows(result.content);
      setTotalElements(result.totalElements);
    } catch (error) {
      showSnackbar("error", getErrorMessage(error, `Failed to load ${entityLabel}s`));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  // Row selection is tied to "the rows currently on screen" — once the page, page size,
  // search term or an external refresh changes those rows out from under it, stale
  // selected ids would silently point at rows no longer visible, so clear it.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, pageSize, search, refreshKey]);

  const debouncedSetSearch = useDebounce((value: string) => {
    setPage(0);
    setSearch(value);
  }, 400);

  const withQuery = (path: string) => (extraQuery ? `${path}?${extraQuery}` : path);

  const goToAdd = () => {
    if (basePath) navigate(withQuery(`${basePath}/new`));
  };

  const goToEdit = (row: T) => {
    if (basePath) navigate(withQuery(`${basePath}/${getRowId(row)}/edit`));
  };

  const handleDelete = async () => {
    if (deleting || !deleteTarget || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(deleteTarget);
      showSnackbar("success", `${entityLabel} deleted successfully`);
      setDeleteTarget(null);
      load();
    } catch (error) {
      showSnackbar("error", getErrorMessage(error, `Failed to delete ${entityLabel}`));
    } finally {
      setDeleting(false);
    }
  };

  const columnsWithActions: TableColumn<T>[] = onUpdate || onDelete || extraRowActions ? [
    ...columns,
    {
      key: "__actions",
      label: "Actions",
      align: "right",
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end" onClick={(e) => e.stopPropagation()}>
          {onUpdate && !hideEditButton && (
            <Tooltip title={`Edit ${entityLabel}`}>
              <IconButton size="small" aria-label={`Edit ${entityLabel}`} onClick={() => goToEdit(row)}>
                <FiEdit2 size={16} />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title={`Delete ${entityLabel}`}>
              <IconButton
                size="small"
                color="error"
                aria-label={`Delete ${entityLabel}`}
                onClick={() => setDeleteTarget(row)}
              >
                <FiTrash2 size={16} />
              </IconButton>
            </Tooltip>
          )}
          {extraRowActions?.(row, load)}
        </Stack>
      ),
    },
  ] : columns;

  const clearSelection = () => setSelectedIds(new Set());
  const selectedRows = rows.filter((row) => selectedIds.has(getRowId(row)));

  return (
    <ListingShell
      title={title}
      description={description}
      icon={icon}
      count={totalElements}
      onAdd={onCreate ? goToAdd : undefined}
      addButtonLabel={addLabel ?? `Add ${entityLabel}`}
      searchValue={search}
      onSearchChange={searchable ? (val) => debouncedSetSearch(val) : undefined}
      filterContent={extraToolbarContent}
      activeFilters={activeFilters}
      onClearFilters={onClearFilters}
    >
      <TableV1
        columns={columnsWithActions}
        rows={rows}
        getRowId={getRowId}
        onRowClick={onRowClick}
        loading={loading}
        page={page}
        pageSize={pageSize}
        totalElements={totalElements}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(0);
        }}
        emptyMessage={search ? `No ${entityLabel}s match your search` : `No ${entityLabel}s yet`}
        emptyDescription={
          search ? "Try a different search term or clear the filter." : onCreate ? `Get started by adding your first ${entityLabel}.` : undefined
        }
        emptyIllustration={search ? <NoSearchResultsIllustration size={88} /> : emptyIllustration}
        emptyAction={!search && onCreate ? { label: addLabel ?? `Add ${entityLabel}`, onClick: goToAdd } : undefined}
        selectable={selectable}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={selectable && bulkActions ? bulkActions(selectedRows, load, clearSelection) : undefined}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${entityLabel}`}
        message={`Are you sure you want to delete this ${entityLabel}? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </ListingShell>
  );
}

export default CrudModule;
