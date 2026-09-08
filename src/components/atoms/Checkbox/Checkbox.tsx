import React from "react";
import { Checkbox as MuiCheckbox, type CheckboxProps } from "@mui/material";

const Checkbox: React.FC<CheckboxProps> = (props) => <MuiCheckbox size="small" {...props} />;

export default Checkbox;
