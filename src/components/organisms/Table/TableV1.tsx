import React, { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Checkbox,
  Toolbar,
  Typography,
  Box,
  Skeleton,
  alpha,
} from "@mui/material";
import EmptyState from "../../molecules/EmptyState/EmptyState";

export interface TableColumn<T> {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  width?: string | number;
  render: (row: T) => React.ReactNode;
  /**
   * When provided, the column header becomes clickable and shows a sort arrow.
   * Sorting happens client-side over the rows currently on screen (this table has no
   * knowledge of a server-side "sort" query param), so this is best suited to columns
   * whose full ordering is meaningful within a single page of results.
   */
  sortAccessor?: (row: T) => string | number;
}

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

export interface TableV1Props<T> {
  columns: TableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string | number;
  loading?: boolean;
  page: number; // 0-based
  pageSize: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  /** Larger custom illustration shown instead of the default icon-in-circle badge — see EmptyState's `illustration` prop. */
  emptyIllustration?: React.ReactNode;
  emptyAction?: EmptyStateAction;
  hidePagination?: boolean;
  /** Adds a checkbox column and enables the bulk-action bar below. Opt-in per module. */
  selectable?: boolean;
  selectedIds?: Set<string | number>;
  onSelectionChange?: (ids: Set<string | number>) => void;
  /** Rendered in the bulk-action bar (replacing the plain header) once 1+ rows are selected. */
  bulkActions?: React.ReactNode;
}

// Generic paginated data table reused by every listing page in the app (admin CRUD
// modules, family/caretaker booking & record lists, etc). Supports optional client-side
// column sorting, row-selection + a bulk-action bar, a sticky header, and a horizontally
// scrollable body (with a scroll-shadow affordance) so wide tables degrade gracefully on
// narrow viewports instead of clipping.
function TableV1<T>({
  columns,
  rows,
  getRowId,
  loading,
  page,
  pageSize,
  totalElements,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  emptyMessage = "No records found",
  emptyDescription,
  emptyIcon,
  emptyIllustration,
  emptyAction,
  hidePagination,
  selectable,
  selectedIds,
  onSelectionChange,
  bulkActions,
}: TableV1Props<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortAccessor) return rows;
    const withKeys = rows.map((row) => ({ row, key: col.sortAccessor!(row) }));
    withKeys.sort((a, b) => {
      if (a.key < b.key) return sortDir === "asc" ? -1 : 1;
      if (a.key > b.key) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return withKeys.map((w) => w.row);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    }
  };

  const selected = selectedIds ?? new Set<string | number>();
  const selectableRowIds = rows.map(getRowId);
  const allSelected = selectableRowIds.length > 0 && selectableRowIds.every((id) => selected.has(id));
  const someSelected = selectableRowIds.some((id) => selected.has(id)) && !allSelected;

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(selectableRowIds));
    }
  };

  const toggleRow = (id: string | number) => {
    if (!onSelectionChange) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  return (
    <Box>
      {selectable && selected.size > 0 && (
        <Toolbar
          sx={{
            bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === "light" ? 0.08 : 0.14),
            borderBottom: "1px solid",
            borderColor: "divider",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ flex: "1 1 auto" }}>
            {selected.size} selected
          </Typography>
          <Box display="flex" gap={1} alignItems="center">
            {bulkActions}
          </Box>
        </Toolbar>
      )}
      <TableContainer
        sx={{
          // Horizontal-scroll affordance for narrow viewports: two solid edge covers plus
          // two shadow gradients, the classic scrollable-region CSS trick. The shadows
          // only render once there's actually overflow to scroll to, and fade away again
          // once you've scrolled all the way to that edge.
          backgroundColor: "background.paper",
          backgroundImage: (theme) => {
            const edge = theme.palette.background.paper;
            const shadowColor = theme.palette.mode === "light" ? "rgba(36,31,26,0.16)" : "rgba(0,0,0,0.45)";
            return [
              `linear-gradient(to right, ${edge} 30%, transparent)`,
              `linear-gradient(to left, ${edge} 30%, transparent)`,
              `linear-gradient(to right, ${shadowColor}, transparent)`,
              `linear-gradient(to left, ${shadowColor}, transparent)`,
            ].join(",");
          },
          backgroundPosition: "left center, right center, left center, right center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "24px 100%, 24px 100%, 10px 100%, 10px 100%",
          backgroundAttachment: "local, local, scroll, scroll",
        }}
      >
        <Table size="small" sx={{ minWidth: 560 }}>
          <TableHead sx={{ position: "sticky", top: 0, zIndex: 2 }}>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox" sx={{ width: 48 }}>
                  <Checkbox
                    size="small"
                    indeterminate={someSelected}
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={rows.length === 0}
                    inputProps={{ "aria-label": "Select all rows" }}
                  />
                </TableCell>
              )}
              {columns.map((col) =>
                col.sortAccessor ? (
                  <TableCell key={col.key} align={col.align ?? "left"} width={col.width} sortDirection={sortKey === col.key ? sortDir : false}>
                    <TableSortLabel
                      active={sortKey === col.key}
                      direction={sortKey === col.key ? sortDir : "asc"}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                    </TableSortLabel>
                  </TableCell>
                ) : (
                  <TableCell key={col.key} align={col.align ?? "left"} width={col.width}>
                    {col.label}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Skeleton variant="rectangular" width={18} height={18} sx={{ borderRadius: "4px" }} />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} sx={{ border: "none" }}>
                  <EmptyState
                    icon={emptyIcon}
                    illustration={emptyIllustration}
                    title={emptyMessage}
                    description={emptyDescription}
                    actionLabel={emptyAction?.label}
                    onAction={emptyAction?.onClick}
                    minHeight={200}
                  />
                </TableCell>
              </TableRow>
            ) : (
              sortedRows.map((row) => {
                const id = getRowId(row);
                const isSelected = selected.has(id);
                return (
                  <TableRow
                    key={id}
                    hover
                    selected={isSelected}
                    onClick={() => onRowClick?.(row)}
                    sx={{
                      cursor: onRowClick ? "pointer" : "default",
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          size="small"
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                          inputProps={{ "aria-label": `Select row ${id}` }}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.key} align={col.align ?? "left"}>
                        {col.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {!hidePagination && (
        <TablePagination
          component="div"
          count={totalElements}
          page={page}
          rowsPerPage={pageSize}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Rows per page:"
          sx={{ borderTop: "1px solid", borderColor: "divider" }}
        />
      )}
    </Box>
  );
}

export default TableV1;
