import React from "react";
import { Rating } from "@mui/material";

export interface RatingInputProps {
  value?: number | null;
  max?: number;
  onChange: (value: number) => void;
}

// Editable star rating counterpart to `RatingDisplay` — used wherever a user picks a
// rating (writing a review's overall/punctuality/care-quality/communication scores).
const RatingInput: React.FC<RatingInputProps> = ({ value, max = 5, onChange }) => (
  <Rating value={value ?? 0} max={max} precision={0.5} onChange={(_, newValue) => onChange(newValue ?? 0)} />
);

export default RatingInput;
