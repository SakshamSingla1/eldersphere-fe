import React from "react";
import { TextField as MuiTextField, type TextFieldProps } from "@mui/material";

const TextField: React.FC<TextFieldProps> = (props) => (
  <MuiTextField size="small" fullWidth variant="outlined" {...props} />
);

export default TextField;
