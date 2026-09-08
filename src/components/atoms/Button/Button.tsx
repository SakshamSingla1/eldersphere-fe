import React from "react";
import { Button as MuiButton, type ButtonProps as MuiButtonProps, CircularProgress } from "@mui/material";
import { motion } from "framer-motion";

// A framer-motion-enhanced MuiButton — adds a hover lift + tap press to every button in
// the app from this one place, rather than touching every call site. `motion.create`
// forwards all non-animation props straight through (including MUI's polymorphic
// `component`/`to`/`href`), and the app-wide `MotionConfig reducedMotion="user"` (see
// main.tsx) automatically disables these transforms for prefers-reduced-motion users.
const MotionMuiButton = motion.create(MuiButton);

export interface ButtonProps extends Omit<MuiButtonProps, "variant" | "color"> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "text";
  loading?: boolean;
  // Lets a "text" (or any) variant still pick a semantic MUI color — e.g. a text-styled
  // "Delete"/"Cancel" row action that should render in the error color without switching
  // to the (filled) "danger" variant.
  color?: MuiButtonProps["color"];
  // MUI's Button is a polymorphic ("OverridableComponent") component whose extra props
  // (e.g. react-router's `to`) only type-check when the generic is inferred at the JSX
  // call site directly on MuiButton. Going through this plain wrapper loses that
  // inference, so `component`/`to` are declared explicitly here and forwarded via an
  // `as any` spread below — every other prop still gets full MuiButtonProps type safety.
  component?: React.ElementType;
  to?: string;
}

const VARIANT_MAP: Record<
  NonNullable<ButtonProps["variant"]>,
  { variant: MuiButtonProps["variant"]; color: MuiButtonProps["color"] }
> = {
  primary: { variant: "contained", color: "primary" },
  secondary: { variant: "contained", color: "secondary" },
  outline: { variant: "outlined", color: "primary" },
  danger: { variant: "contained", color: "error" },
  text: { variant: "text", color: "primary" },
};

const Button: React.FC<ButtonProps> = ({ variant = "primary", loading, disabled, children, startIcon, color, ...rest }) => {
  const mapped = VARIANT_MAP[variant];
  return (
    <MotionMuiButton
      whileHover={disabled || loading ? null : { y: -1 }}
      whileTap={disabled || loading ? null : { scale: 0.97 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      variant={mapped.variant}
      color={color ?? mapped.color}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
      {...(rest as any)}
    >
      {children}
    </MotionMuiButton>
  );
};

export default Button;
