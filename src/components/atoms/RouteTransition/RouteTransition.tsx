import React from "react";
import { motion } from "framer-motion";

// Subtle fade + slight-rise used for whole-page mounts (the five public routes) and,
// via AnimatePresence in DashboardLayout, for in-shell navigation between sidebar pages.
// Kept fast (180ms) and small (8px) so it reads as "alive" rather than disorienting —
// framer-motion's app-wide `MotionConfig reducedMotion="user"` (see main.tsx) already
// collapses this to an instant opacity fade for anyone with prefers-reduced-motion set.
const variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const RouteTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    variants={variants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.18, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

export default RouteTransition;
