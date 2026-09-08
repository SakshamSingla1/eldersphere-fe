import React from "react";
import { Grid, Stack, Typography } from "@mui/material";

export interface KeyValueItem {
  key?: React.Key;
  label: string;
  value: React.ReactNode;
  /** Span the full row instead of sharing it two-up (default) on sm+ screens. */
  fullWidth?: boolean;
}

export interface KeyValueGridProps {
  items: KeyValueItem[];
  /** "grid" (default) lays items two-up on sm+ screens; "stack" renders one per row (e.g. inside a narrow dialog). */
  layout?: "grid" | "stack";
  spacing?: number;
}

const Entry: React.FC<{ item: KeyValueItem }> = ({ item }) => (
  <>
    <Typography variant="caption" color="text.secondary" display="block">
      {item.label}
    </Typography>
    <Typography fontWeight={600}>{item.value}</Typography>
  </>
);

// Generic label/value grid for detail views (Booking Detail, Medical Record Detail, Elder
// Profile lookup, ...) that previously each hand-rolled their own `DetailRow` helper —
// caption label above a bold value, either in a responsive 2-up grid or a single-column
// stack (e.g. a compact dialog).
const KeyValueGrid: React.FC<KeyValueGridProps> = ({ items, layout = "grid", spacing = 2.5 }) => {
  if (layout === "stack") {
    return (
      <Stack spacing={spacing > 2 ? 1.5 : spacing}>
        {items.map((item, i) => (
          <div key={item.key ?? i}>
            <Entry item={item} />
          </div>
        ))}
      </Stack>
    );
  }

  return (
    <Grid container spacing={spacing}>
      {items.map((item, i) => (
        <Grid key={item.key ?? i} size={{ xs: 12, sm: item.fullWidth ? 12 : 6 }}>
          <Entry item={item} />
        </Grid>
      ))}
    </Grid>
  );
};

export default KeyValueGrid;
