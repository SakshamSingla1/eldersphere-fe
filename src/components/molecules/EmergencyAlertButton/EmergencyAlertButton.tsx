import React, { useState } from "react";
import { Button as MuiButton, CircularProgress, Box, type ButtonProps as MuiButtonProps } from "@mui/material";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";

const MotionMuiButton = motion.create(MuiButton);

export interface EmergencyAlertButtonProps {
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  size?: MuiButtonProps["size"];
}

// The Emergency Alert trigger deliberately presses differently from every other button in
// the app. Every other Button (atoms/Button) gets a quick, light 0.97-scale tap —
// appropriate for routine actions. This one instead presses slower and deeper (a firmer,
// more deliberate compression) and, on release, sends out a single soft ring — like a
// heartbeat pulse or a sonar ping confirming the alert registered — plus a real haptic
// buzz on devices that support it. The intent is weight and reassurance ("this was taken
// seriously"), not playfulness, given what the button actually does. Built directly on
// MuiButton (rather than wrapping atoms/Button) purely to give it its own whileTap/
// transition without fighting the shared Button's built-in ones — the click handler,
// loading spinner and disabled behavior otherwise mirror it exactly, so this reads as the
// same button family everywhere else in the app.
const EmergencyAlertButton: React.FC<EmergencyAlertButtonProps> = ({ loading, disabled, onClick, children, size = "large" }) => {
  const prefersReducedMotion = useReducedMotion();
  const [pulseKey, setPulseKey] = useState(0);
  const isInert = disabled || loading;

  const handleClick = () => {
    if (isInert) return;
    // Feature-detected, best-effort — most desktop browsers simply don't expose
    // navigator.vibrate, and this must never throw or block the actual trigger.
    try {
      navigator.vibrate?.([30, 25, 60]);
    } catch {
      // ignore — haptic feedback is pure garnish
    }
    if (!prefersReducedMotion) setPulseKey((k) => k + 1);
    onClick();
  };

  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <AnimatePresence>
        {!prefersReducedMotion && pulseKey > 0 && (
          <motion.span
            key={pulseKey}
            initial={{ opacity: 0.45, scale: 1 }}
            animate={{ opacity: 0, scale: 1.9 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 14,
              backgroundColor: "#C0392B",
              pointerEvents: "none",
            }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
      <MotionMuiButton
        variant="contained"
        color="error"
        size={size}
        disabled={isInert}
        onClick={handleClick}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        whileTap={isInert ? undefined : { scale: 0.92 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
      >
        {children}
      </MotionMuiButton>
    </Box>
  );
};

export default EmergencyAlertButton;
