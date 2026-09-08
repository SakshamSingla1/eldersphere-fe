import React from "react";
import { Rating } from "@mui/material";

export interface RatingDisplayProps {
  value?: number | null;
  max?: number;
}

// Read-only star rating — every place ratings are rendered for viewing (caretaker cards,
// review lists/tables, testimonials) shares this one component so star size/color/half-star
// handling stays consistent instead of each page reaching for its own <Rating readOnly />.
const RatingDisplay: React.FC<RatingDisplayProps> = ({ value, max = 5 }) => (
  <Rating value={value ?? 0} max={max} precision={0.5} readOnly />
);

export default RatingDisplay;
