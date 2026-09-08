import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import { motion } from "framer-motion";
import FavoriteIcon from "@mui/icons-material/Favorite";
import RefreshIcon from "@mui/icons-material/Refresh";
import Button from "../Button/Button";
import { SomethingWentWrongIllustration } from "../Illustrations/Illustrations";

// The on-brand fallback screen shown in place of the crashed tree — a plain function
// component (not the class itself) so it's free to use hooks/theme/motion exactly like
// every other full-page state in the app (NotFoundPage, EmptyState, ...).
const ErrorFallback: React.FC<{ onReload: () => void }> = ({ onReload }) => (
  <Box
    sx={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      bgcolor: "background.default",
      p: 3,
    }}
  >
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
      <Stack direction="row" alignItems="center" spacing={1} justifyContent="center" mb={4}>
        <FavoriteIcon color="primary" />
        <Typography variant="h6" component="span" fontWeight={800}>
          ElderSphere
        </Typography>
      </Stack>
      <Box sx={{ mx: "auto", mb: 1 }}>
        <SomethingWentWrongIllustration size={140} />
      </Box>
      <Typography variant="h3" component="h1" fontWeight={800} sx={{ fontSize: { xs: 32, md: 40 }, mb: 1 }}>
        Something went wrong
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 420, mx: "auto", mb: 4 }}>
        We hit an unexpected snag loading this page. Your data is safe — reloading usually
        fixes it.
      </Typography>
      <Button variant="primary" startIcon={<RefreshIcon />} onClick={onReload}>
        Reload
      </Button>
    </motion.div>
  </Box>
);

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Top-level catch-all for render/lifecycle errors anywhere in the tree — without this, an
// unhandled throw during render unmounts the whole app and React shows a blank white
// screen. Deliberately a class component: componentDidCatch/getDerivedStateFromError have
// no hook equivalent, so this is the one place in the app that has to be a class.
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error("Unhandled error caught by ErrorBoundary:", error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback onReload={this.handleReload} />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
