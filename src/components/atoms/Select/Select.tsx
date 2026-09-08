import React from "react";
import { TextField as MuiTextField, MenuItem, type TextFieldProps } from "@mui/material";

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends Omit<TextFieldProps, "select"> {
  options: SelectOption[];
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({ options, placeholder, children, ...rest }) => (
  <MuiTextField select size="small" fullWidth variant="outlined" {...rest}>
    {placeholder && (
      <MenuItem value="">
        <em>{placeholder}</em>
      </MenuItem>
    )}
    {options.map((opt) => (
      <MenuItem key={opt.value} value={opt.value}>
        {opt.label}
      </MenuItem>
    ))}
    {children}
  </MuiTextField>
);

export default Select;
