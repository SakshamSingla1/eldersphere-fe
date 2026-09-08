import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Snackbar, Alert, Slide, type SlideProps, Button as MuiButton, IconButton } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

type SnackbarSeverity = "success" | "error" | "info" | "warning";

export interface SnackbarAction {
  label: string;
  onClick: () => void;
}

interface SnackbarContextProps {
  /**
   * `action` renders a button (e.g. "Undo") inside the snackbar alongside its close icon —
   * used for low-risk-but-annoying-to-reverse actions (e.g. removing a favorite) where
   * calling the corresponding re-create endpoint gives the user a few seconds to back out.
   */
  showSnackbar: (severity: SnackbarSeverity, message: string, duration?: number, action?: SnackbarAction) => void;
}

const SnackbarContext = createContext<SnackbarContextProps | null>(null);

const SEVERITY_ICON: Record<SnackbarSeverity, React.ReactNode> = {
  success: <CheckCircleRoundedIcon fontSize="inherit" />,
  error: <ErrorRoundedIcon fontSize="inherit" />,
  warning: <WarningRoundedIcon fontSize="inherit" />,
  info: <InfoRoundedIcon fontSize="inherit" />,
};

// Slide-in-from-the-right transition — MUI's <Slide> already respects
// prefers-reduced-motion-averse users fine since it's a short, small-distance transform;
// the app-wide MotionConfig only governs framer-motion, but MUI's transition is brief
// enough (225ms default) not to be an accessibility concern on its own.
const SlideTransition = (props: SlideProps) => <Slide {...props} direction="left" />;

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<{
    open: boolean;
    severity: SnackbarSeverity;
    message: string;
    duration: number;
    action?: SnackbarAction;
  }>({
    open: false,
    severity: "info",
    message: "",
    duration: 4000,
  });

  const showSnackbar = useCallback((severity: SnackbarSeverity, message: string, duration = 4000, action?: SnackbarAction) => {
    setState({ open: true, severity, message, duration, action });
  }, []);

  const handleClose = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  // Clicking the action (e.g. "Undo") both runs its callback and dismisses the snackbar —
  // otherwise a stale "Undo" button would sit there after the state it referred to already
  // changed underneath it.
  const handleActionClick = useCallback(() => {
    setState((s) => {
      s.action?.onClick();
      return { ...s, open: false };
    });
  }, []);

  const value = useMemo(() => ({ showSnackbar }), [showSnackbar]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={state.duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        TransitionComponent={SlideTransition}
      >
        <Alert
          onClose={handleClose}
          severity={state.severity}
          variant="filled"
          icon={SEVERITY_ICON[state.severity]}
          // Passing `action` replaces MUI's auto-generated close-only action entirely, so
          // when this snackbar carries one (e.g. "Undo"), the close icon has to be rebuilt
          // alongside it by hand — every other (actionless) snackbar keeps the default
          // close-icon-only behavior driven by `onClose` above.
          action={
            state.action ? (
              <>
                <MuiButton color="inherit" size="small" onClick={handleActionClick} sx={{ fontWeight: 700 }}>
                  {state.action.label}
                </MuiButton>
                <IconButton size="small" color="inherit" onClick={handleClose} aria-label="Dismiss">
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </>
            ) : undefined
          }
          sx={{
            minWidth: 300,
            borderRadius: "14px",
            boxShadow: "0 12px 28px rgba(36,31,26,0.22)",
            alignItems: "center",
            "& .MuiAlert-icon": { fontSize: 22 },
          }}
        >
          {state.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
};
