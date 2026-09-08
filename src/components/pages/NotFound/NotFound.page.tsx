import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Typography, Stack } from "@mui/material";
import { motion } from "framer-motion";
import FavoriteIcon from "@mui/icons-material/Favorite";
import Button from "../../atoms/Button/Button";
import { NotFoundIllustration } from "../../atoms/Illustrations/Illustrations";

// Top-level catch-all for any URL that doesn't match a public route or an authenticated
// shell's own routes — e.g. a stale bookmark or typo'd path while signed out. (Signed-in
// role shells already redirect unknown sub-paths to their own dashboard; this only ever
// fires above that, at the app root.)
const NotFoundPage: React.FC = () => (
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
        <NotFoundIllustration size={140} />
      </Box>
      <Typography variant="h3" component="h1" fontWeight={800} sx={{ fontSize: { xs: 32, md: 40 }, mb: 1 }}>
        Page not found
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 420, mx: "auto", mb: 4 }}>
        The page you're looking for doesn't exist or may have moved. Let's get you back on track.
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center">
        <Button variant="primary" component={RouterLink} to="/">
          Go to Homepage
        </Button>
        <Button variant="outline" component={RouterLink} to="/login">
          Log In
        </Button>
      </Stack>
    </motion.div>
  </Box>
);

export default NotFoundPage;
