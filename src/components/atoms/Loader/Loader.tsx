import React from "react";
import { Box, CircularProgress } from "@mui/material";

const Loader: React.FC<{ minHeight?: number | string }> = ({ minHeight = 200 }) => (
  <Box display="flex" alignItems="center" justifyContent="center" minHeight={minHeight}>
    <CircularProgress />
  </Box>
);

export default Loader;
