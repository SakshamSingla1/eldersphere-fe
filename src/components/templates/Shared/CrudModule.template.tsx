import React, { useCallback, useEffect, useId, useState } from "react";
import { Dialog, DialogContent, FormControlLabel, Grid, Typography, Box, Divider, Stack, IconButton, Tooltip } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import ListingShell, { type ActiveFilter } from "./ListingShell.template";
import FormShell from "./FormShell.template";
import TableV1, { type TableColumn } from "../../organisms/Table/TableV1";
import ConfirmDialog from "../../molecules/ConfirmDialog/ConfirmDialog";
import DialogTransition from "../../atoms/DialogTransition/DialogTransition";
import Button from "../../atoms/Button/Button";
import TextField from "../../atoms/TextField/TextField";
import DatePicker from "../../atoms/DatePicker/DatePicker";
import Select, { type SelectOption } from "../../atoms/Select/Select";
import Checkbox from "../../atoms/Checkbox/Checkbox";
import ErrorMessage from "../../atoms/ErrorMessage/ErrorMessage";
import FieldError from "../../atoms/FieldError/FieldError";
import { NoSearchResultsIllustration } from "../../atoms/Illustrations/Illustrations";
import { useDebounce, getErrorMessage } from "../../../utils/helper";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { useFileService } from "../../../services/useFileService";
import type { PageResponse } from "../../../utils/types";
import type { ResourceTypeEnum } from "../../../utils/enums";

export interface CrudFieldConfig {
  name: string;
  label: string;
  type?: "text" | "number" | "select" | "checkbox" | "textarea" | "date" | "file";
  options?: SelectOption[];
  required?: boolean;
  gridSize?: number; // out of 12, defaults to 12
  helperText?: string;
  resourceType?: ResourceTypeEnum; // required when type === "file"
  hideOnEdit?: boolean; // e.g. a "password" field that only applies when creating
  hideOnCreate?: boolean;
  /**
   * Groups this field (and any immediately-following fields sharing the same section
   * name) under a small heading + divider within the form body — for modules with many
   * fields, this reads much more clearly than one flat list. Fields with no `section`
   * render exactly as before (no heading).
   */
  section?: string;
  /** Extra validation beyond the built-in required-field check, e.g. email format. */
  validate?: (value: any, values: Record<string, any>) => string | undefined;
}

export interface CrudModuleProps<T> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  columns: TableColumn<T>[];
  getRowId: (row: T) => number | string;
  fetchPage: (page: number, size: number, search: string) => Promise<PageResponse<T>>;
  fields?: CrudFieldConfig[];
  initialValues?: Record<string, any>;
  toFormValues?: (row: T) => Record<string, any>;
  onCreate?: (values: Record<string, any>) => Promise<void>;
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
  /** Optional row-click handler (e.g. navigate to a detail view). Independent of the Edit dialog. */
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

// Generic reusable Listing + Form-shell CRUD pattern — every admin module (Users,
// Services, Elder Profiles, Roles, Landing content, ...) wires its columns/fields/service
// calls into this one component instead of re-implementing list state, pagination,
// search-debounce, add/edit dialog and delete-confirmation each time.
function CrudModule<T>({
  title,
  description,
  icon,
  columns,
  getRowId,
  fetchPage,
  fields = [],
  initialValues = {},
  toFormValues,
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
  const { showSnackbar } = useSnackbar();
  const fileService = useFileService();
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [rows, setRows] = useState<T[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<T | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>(initialValues);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);

  // The add/edit Dialog below has no <DialogTitle> (FormShell renders its own header
  // instead) — wire FormShell's title to the Dialog explicitly via aria-labelledby so
  // screen readers announce the dialog's purpose instead of just "dialog".
  const dialogTitleId = useId();

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

  const openAddDialog = () => {
    setEditingRow(null);
    setFormValues(initialValues);
    setFormError(null);
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openEditDialog = (row: T) => {
    setEditingRow(row);
    setFormValues(toFormValues ? toFormValues(row) : (row as unknown as Record<string, any>));
    setFormError(null);
    setFieldErrors({});
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
  };

  // Every module gets the same "required field left empty" + optional custom `validate`
  // check for free, surfaced inline under the field (see renderField) instead of only
  // failing later against the backend.
  const validateFields = (): boolean => {
    const visibleFields = fields.filter((field) => (editingRow ? !field.hideOnEdit : !field.hideOnCreate));
    const errors: Record<string, string> = {};
    for (const field of visibleFields) {
      const value = formValues[field.name];
      if (field.required && field.type !== "checkbox" && field.type !== "file" && (value === "" || value == null)) {
        errors[field.name] = `${field.label} is required`;
        continue;
      }
      const customError = field.validate?.(value, formValues);
      if (customError) errors[field.name] = customError;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (saving) return; // guards against a double-click firing a duplicate create/update request
    if (!validateFields()) return;
    setSaving(true);
    setFormError(null);
    try {
      if (editingRow && onUpdate) {
        await onUpdate(editingRow, formValues);
        showSnackbar("success", `${entityLabel} updated successfully`);
      } else if (!editingRow && onCreate) {
        await onCreate(formValues);
        showSnackbar("success", `${entityLabel} created successfully`);
      }
      setDialogOpen(false);
      load();
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
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

  const handleFileSelected = async (field: CrudFieldConfig, file: File | undefined) => {
    if (!file || !field.resourceType) return;
    setUploadingField(field.name);
    try {
      const asset = await fileService.upload(file, field.resourceType);
      handleFieldChange(field.name, asset.id);
      handleFieldChange(`${field.name}__fileName`, asset.fileName);
    } catch (error) {
      showSnackbar("error", getErrorMessage(error, "File upload failed"));
    } finally {
      setUploadingField(null);
    }
  };

  // Consistent inline validation-error styling: an error message directly under the
  // field, in the app's error color, with an icon — used uniformly by every field type
  // below except "date" (native browser affordance, left untouched here), "file" and
  // "checkbox" (which don't have a meaningful "required and empty" state the same way).
  const fieldHelperText = (field: CrudFieldConfig, error?: string) =>
    error ? <FieldError message={error} /> : field.helperText;

  const renderField = (field: CrudFieldConfig) => {
    const value = formValues[field.name] ?? "";
    const fieldError = fieldErrors[field.name];
    switch (field.type) {
      case "file": {
        const fileName = formValues[`${field.name}__fileName`];
        return (
          <Box>
            <Typography variant="body2" fontWeight={600} mb={0.5}>
              {field.label}
            </Typography>
            <Button
              variant="outline"
              component="label"
              startIcon={<UploadFileIcon />}
              loading={uploadingField === field.name}
            >
              {fileName ? "Replace File" : "Upload File"}
              <input
                type="file"
                hidden
                onChange={(e) => handleFileSelected(field, e.target.files?.[0])}
              />
            </Button>
            {fileName && (
              <Typography variant="caption" display="block" mt={0.5} color="text.secondary">
                {fileName}
              </Typography>
            )}
          </Box>
        );
      }
      case "select":
        return (
          <Select
            label={field.label}
            options={field.options ?? []}
            value={value}
            required={field.required}
            error={Boolean(fieldError)}
            helperText={fieldHelperText(field, fieldError)}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );
      case "checkbox":
        return (
          <FormControlLabel
            control={<Checkbox checked={Boolean(value)} onChange={(e) => handleFieldChange(field.name, e.target.checked)} />}
            label={field.label}
          />
        );
      case "textarea":
        return (
          <TextField
            label={field.label}
            value={value}
            required={field.required}
            multiline
            minRows={3}
            error={Boolean(fieldError)}
            helperText={fieldHelperText(field, fieldError)}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );
      case "number":
        return (
          <TextField
            label={field.label}
            type="number"
            value={value}
            required={field.required}
            error={Boolean(fieldError)}
            helperText={fieldHelperText(field, fieldError)}
            onChange={(e) => handleFieldChange(field.name, e.target.value === "" ? "" : Number(e.target.value))}
          />
        );
      case "date":
        return (
          <DatePicker
            label={field.label}
            value={value}
            required={field.required}
            helperText={field.helperText}
            onChange={(newValue) => handleFieldChange(field.name, newValue)}
          />
        );
      default:
        return (
          <TextField
            label={field.label}
            value={value}
            required={field.required}
            error={Boolean(fieldError)}
            helperText={fieldHelperText(field, fieldError)}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );
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
              <IconButton size="small" aria-label={`Edit ${entityLabel}`} onClick={() => openEditDialog(row)}>
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

  // Group fields into sections (in field-array order) so a form with many fields reads as
  // a few labeled groups instead of one flat list — a field with no `section` renders
  // exactly as before, so this is a no-op for every module that doesn't opt in.
  const visibleFields = fields.filter((field) => (editingRow ? !field.hideOnEdit : !field.hideOnCreate));
  const fieldGroups: { section?: string; fields: CrudFieldConfig[] }[] = [];
  for (const field of visibleFields) {
    const last = fieldGroups[fieldGroups.length - 1];
    if (last && last.section === field.section) {
      last.fields.push(field);
    } else {
      fieldGroups.push({ section: field.section, fields: [field] });
    }
  }

  return (
    <ListingShell
      title={title}
      description={description}
      icon={icon}
      count={totalElements}
      onAdd={onCreate ? openAddDialog : undefined}
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
        emptyAction={!search && onCreate ? { label: addLabel ?? `Add ${entityLabel}`, onClick: openAddDialog } : undefined}
        selectable={selectable}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={selectable && bulkActions ? bulkActions(selectedRows, load, clearSelection) : undefined}
      />

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
        TransitionComponent={DialogTransition}
        aria-labelledby={dialogTitleId}
      >
        <DialogContent sx={{ pt: 3 }}>
          <FormShell
            titleId={dialogTitleId}
            title={editingRow ? `Edit ${entityLabel}` : `Add ${entityLabel}`}
            actions={
              <>
                <Button variant="text" onClick={closeDialog} disabled={saving}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit} loading={saving}>
                  Save
                </Button>
              </>
            }
          >
            <ErrorMessage message={formError} />
            <Stack spacing={2.5}>
              {fieldGroups.map((group, groupIdx) => (
                <Box key={group.section ?? `__ungrouped-${groupIdx}`}>
                  {group.section && (
                    <>
                      <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
                        {group.section}
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                    </>
                  )}
                  <Grid container spacing={2}>
                    {group.fields.map((field) => (
                      <Grid size={{ xs: 12, sm: field.gridSize ?? 12 }} key={field.name}>
                        {renderField(field)}
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
            </Stack>
          </FormShell>
        </DialogContent>
      </Dialog>

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
