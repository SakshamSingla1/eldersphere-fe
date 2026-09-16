import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, FormControlLabel, Grid, Typography, Box, Divider, Stack } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PageHeader from "../../molecules/PageHeader/PageHeader";
import FormShell from "./FormShell.template";
import { FormFieldsSkeleton } from "../../molecules/Skeletons/Skeletons";
import Button from "../../atoms/Button/Button";
import TextField from "../../atoms/TextField/TextField";
import DatePicker from "../../atoms/DatePicker/DatePicker";
import Select, { type SelectOption } from "../../atoms/Select/Select";
import Checkbox from "../../atoms/Checkbox/Checkbox";
import ErrorMessage from "../../atoms/ErrorMessage/ErrorMessage";
import FieldError from "../../atoms/FieldError/FieldError";
import AddressAutocomplete from "../../molecules/AddressAutocomplete/AddressAutocomplete";
import CaretakerSearchAutocomplete from "../../molecules/CaretakerSearchAutocomplete/CaretakerSearchAutocomplete";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import { useFileService } from "../../../services/useFileService";
import { getErrorMessage } from "../../../utils/helper";
import type { ResourceTypeEnum } from "../../../utils/enums";

export interface CrudFieldConfig {
  name: string;
  label: string;
  /**
   * "address" renders a free OpenStreetMap-backed autocomplete (see AddressAutocomplete)
   * instead of a plain text field. "caretaker" renders a search-by-name/email/phone picker
   * (see CaretakerSearchAutocomplete) that stores the selected caretaker's profile id.
   */
  type?: "text" | "number" | "select" | "checkbox" | "textarea" | "date" | "file" | "address" | "caretaker";
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
  validate?: (value: any, values: Record<string, any>) => string | null;
}

export interface CrudFormPageProps<T> {
  /** Singular label used in the page title ("Add service" / "Edit service") and toasts. */
  entityLabel: string;
  /** Plural label used in the back-link ("Back to services"). Defaults to `${entityLabel}s`. */
  entityLabelPlural?: string;
  icon?: React.ReactNode;
  /**
   * Listing route to return to on Cancel and after a successful save, e.g. "/admin/services".
   * May include a query string (e.g. "/admin/roles-permissions?tab=permissions") so the
   * listing can restore context — an active tab, a scoped lookup id — that a plain route
   * change would otherwise lose.
   */
  backPath: string;
  fields: CrudFieldConfig[];
  initialValues?: Record<string, any>;
  toFormValues?: (row: T) => Record<string, any>;
  /**
   * Fetches the record being edited. Required on any module whose CrudModule passes
   * `onUpdate` (i.e. anything reachable at the `:id/edit` route) — not needed on a
   * create-only page.
   */
  getById?: (id: string) => Promise<T>;
  onCreate?: (values: Record<string, any>) => Promise<void>;
  onUpdate?: (row: T, values: Record<string, any>) => Promise<void>;
}

// Generic reusable Add/Edit form PAGE — the page-routed counterpart to CrudModule's
// listing view. Every admin module that used to open CrudModule's add/edit Dialog now
// navigates here instead (see CrudModule.template.tsx's `basePath` prop): a real
// `/admin/{module}/new` or `/admin/{module}/:id/edit` URL rendering this component,
// configured with the same `fields`/`onCreate`/`onUpdate` wiring the module already had.
function CrudFormPage<T>({
  entityLabel,
  entityLabelPlural,
  icon,
  backPath,
  fields,
  initialValues = {},
  toFormValues,
  getById,
  onCreate,
  onUpdate,
}: CrudFormPageProps<T>) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const fileService = useFileService();
  const isEdit = Boolean(id);

  const [row, setRow] = useState<T | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>(initialValues);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Fetches the record being edited whenever `id` is present (create mode has nothing to
  // fetch). Re-runs if `id` changes so navigating from one edit URL straight to another
  // (rare, but the route allows it) doesn't leave stale data on screen.
  useEffect(() => {
    if (!isEdit || !id) return;
    if (!getById) {
      setLoadError(`This ${entityLabel} can't be loaded for editing.`);
      setLoadingRecord(false);
      return;
    }
    let cancelled = false;
    setLoadingRecord(true);
    setLoadError(null);
    getById(id)
      .then((result) => {
        if (cancelled) return;
        setRow(result);
        setFormValues(toFormValues ? toFormValues(result) : (result as unknown as Record<string, any>));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getErrorMessage(err, `Failed to load this ${entityLabel}`));
      })
      .finally(() => {
        if (!cancelled) setLoadingRecord(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleFieldChange = (name: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
  };

  const visibleFields = fields.filter((field) => (isEdit ? !field.hideOnEdit : !field.hideOnCreate));

  // Same "required field left empty" + optional custom `validate` check CrudModule's
  // dialog used to do, surfaced inline under the field (see renderField below).
  const validateFields = (): boolean => {
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

  const handleCancel = () => navigate(backPath);

  const handleSubmit = async () => {
    if (saving) return; // guards against a double-click firing a duplicate create/update request
    if (!validateFields()) return;
    setSaving(true);
    setFormError(null);
    try {
      if (isEdit && onUpdate && row) {
        await onUpdate(row, formValues);
        showSnackbar("success", `${entityLabel} updated successfully`);
      } else if (!isEdit && onCreate) {
        await onCreate(formValues);
        showSnackbar("success", `${entityLabel} created successfully`);
      }
      navigate(backPath);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
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
      case "address":
        return (
          <AddressAutocomplete
            label={field.label}
            value={value}
            required={field.required}
            helperText={fieldHelperText(field, fieldError)}
            onChange={(newValue) => handleFieldChange(field.name, newValue)}
          />
        );
      case "caretaker": {
        // Companion field (set by toFormValues, mirroring the "file" type's `__fileName`
        // pattern) so an already-assigned caretaker shows by name when editing, without a
        // fresh search — see CrudFormPageProps.toFormValues on the emergency alert form.
        const initialLabel = formValues[`${field.name}__label`];
        return (
          <CaretakerSearchAutocomplete
            label={field.label}
            placeholder="Search by name, email, or phone"
            helperText={fieldHelperText(field, fieldError)}
            initialValue={value && initialLabel ? { id: Number(value), fullName: initialLabel } : null}
            onSelect={(caretaker) => {
              handleFieldChange(field.name, caretaker?.id ?? "");
              handleFieldChange(`${field.name}__label`, caretaker?.fullName ?? "");
            }}
          />
        );
      }
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

  // Group fields into sections (in field-array order) so a form with many fields reads as
  // a few labeled groups instead of one flat list — a field with no `section` renders
  // exactly as before, so this is a no-op for every module that doesn't opt in.
  const fieldGroups: { section?: string; fields: CrudFieldConfig[] }[] = [];
  for (const field of visibleFields) {
    const last = fieldGroups[fieldGroups.length - 1];
    if (last && last.section === field.section) {
      last.fields.push(field);
    } else {
      fieldGroups.push({ section: field.section, fields: [field] });
    }
  }

  const plural = entityLabelPlural ?? `${entityLabel}s`;

  return (
    <Box>
      <PageHeader
        icon={icon}
        title={isEdit ? `Edit ${entityLabel}` : `Add ${entityLabel}`}
        onBack={handleCancel}
        backLabel={`Back to ${plural}`}
      />
      {/* No extra padding here — CardContent already carries the app-wide 22px inset (see
          theme.ts's MuiCardContent override); adding padding on the Card too would double
          it up into an oversized ~46px gutter, out of step with every other card-based
          template in the app. */}
      <Card>
        <CardContent>
          {loadingRecord ? (
            <FormFieldsSkeleton count={Math.max(3, visibleFields.length)} />
          ) : loadError ? (
            <ErrorMessage message={loadError} />
          ) : (
            <FormShell
              actions={
                <>
                  <Button variant="text" onClick={handleCancel} disabled={saving}>
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
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default CrudFormPage;
