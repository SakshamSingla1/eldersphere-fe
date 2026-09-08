import React from "react";
import { Card, Box, Typography, Chip, IconButton, InputAdornment } from "@mui/material";
import TextField from "../../atoms/TextField/TextField";
import Button from "../../atoms/Button/Button";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";

export interface ActiveFilter {
  /** Stable key so React can key the chip; also handy for consumers building the list. */
  key: string;
  /** Chip label, e.g. "Category: Nursing". */
  label: string;
  onRemove: () => void;
}

export interface ListingShellProps {
  title: string;
  description?: string;
  count?: number;
  icon?: React.ReactNode;
  children: React.ReactNode;
  addButtonLabel?: string;
  onAdd?: () => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filterContent?: React.ReactNode;
  /** Currently-applied filters, shown as removable chips below the filter controls. */
  activeFilters?: ActiveFilter[];
  /** Shown as a "Clear all filters" action whenever `activeFilters` is non-empty. */
  onClearFilters?: () => void;
}

// Shared page chrome reused by every admin listing page (Users, Bookings, Services, ...):
// a header card (title / count / add button) plus an optional search + filter row, wrapping
// whatever table/content is passed as children. Mirrors the reference project's
// ListingShell.template.tsx, simplified to plain MUI (no custom design system).
const ListingShell: React.FC<ListingShellProps> = ({
  title,
  description,
  count,
  icon,
  children,
  addButtonLabel,
  onAdd,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filterContent,
  activeFilters,
  onClearFilters,
}) => {
  const hasActiveFilters = Boolean(activeFilters && activeFilters.length > 0);

  return (
    <Box>
      <Card sx={{ mb: 2.5, p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={1.5} minWidth={0}>
            {icon}
            <Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6" fontWeight={800}>
                  {title}
                </Typography>
                {typeof count === "number" && <Chip label={count} size="small" color="primary" variant="outlined" />}
              </Box>
              {description && (
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              )}
            </Box>
          </Box>
          {onAdd && (
            <Button variant="primary" startIcon={<AddIcon />} onClick={onAdd}>
              {addButtonLabel ?? "Add New"}
            </Button>
          )}
        </Box>

        {(onSearchChange || filterContent) && (
          <Box
            sx={{
              mt: 2.5,
              p: 1.75,
              borderRadius: "12px",
              bgcolor: "action.hover",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center">
              {onSearchChange && (
                <Box maxWidth={320} flex="1 1 260px">
                  <TextField
                    placeholder={searchPlaceholder}
                    value={searchValue ?? ""}
                    onChange={(e) => onSearchChange(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: searchValue ? (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            aria-label="Clear search"
                            onClick={() => onSearchChange("")}
                            edge="end"
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    }}
                  />
                </Box>
              )}
              {filterContent && (
                <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center">
                  {filterContent}
                </Box>
              )}
            </Box>

            {hasActiveFilters && (
              <Box display="flex" gap={1} flexWrap="wrap" alignItems="center" mt={1.5} pt={1.5} sx={{ borderTop: "1px dashed", borderColor: "divider" }}>
                <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
                  <FilterAltOutlinedIcon fontSize="small" />
                  <Typography variant="caption" fontWeight={700}>
                    Active filters:
                  </Typography>
                </Box>
                {activeFilters!.map((f) => (
                  <Chip key={f.key} label={f.label} size="small" color="primary" variant="outlined" onDelete={f.onRemove} />
                ))}
                {onClearFilters && (
                  <Button variant="text" size="small" onClick={onClearFilters} sx={{ minHeight: "auto", py: 0.25 }}>
                    Clear all filters
                  </Button>
                )}
              </Box>
            )}
          </Box>
        )}
      </Card>

      <Card sx={{ overflow: "hidden" }}>{children}</Card>
    </Box>
  );
};

export default ListingShell;
