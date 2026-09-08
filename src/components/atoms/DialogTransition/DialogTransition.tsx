import React from "react";
import { motion } from "framer-motion";
import type { TransitionProps } from "@mui/material/transitions";

// A framer-motion replacement for MUI Dialog's default enter/exit transition — a soft
// scale + fade + slight rise instead of the stock Grow/Fade, so dialogs (CRUD add/edit
// forms, confirm-delete) match the same motion language as the rest of the app (Button's
// hover/tap, RouteTransition, the sidebar's sliding pill) instead of looking like a
// separate, un-styled MUI default.
//
// MUI's Dialog/Modal keeps this component mounted for the whole open/close cycle and
// just flips the `in` prop — it does NOT unmount on close by itself. It waits for this
// component to call `onExited` once the close animation finishes before it actually
// removes the dialog from the DOM. That's why this is a plain `animate={in ? ... : ...}`
// driven by `onAnimationComplete`, not an `AnimatePresence`/conditional-render — doing
// the AnimatePresence dance here would race with Modal's own mount lifecycle and the
// dialog would never actually close.
const DialogTransition = React.forwardRef<HTMLDivElement, TransitionProps & { children: React.ReactElement; className?: string }>(
  function DialogTransition(props, ref) {
    // Deliberately destructure (not spread) every prop MUI's Modal/Transition machinery
    // passes down — react-transition-group props like `appear`/`timeout`/`easing` and
    // MUI's own `ownerState` are meant for a <Transition> component, not a plain DOM
    // node, so spreading `...other` onto motion.div leaked them as invalid/unknown DOM
    // attributes (React warnings). Only `className` (and `children`, handled above) are
    // safe to forward to the actual element.
    const { children, in: inProp, onEnter, onExited, className } = props;
    return (
      <motion.div
        ref={ref}
        className={className}
        initial={false}
        animate={inProp ? "enter" : "exit"}
        variants={{
          enter: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.95, y: 8 },
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onAnimationComplete={(definition) => {
          if (definition === "enter") (onEnter as any)?.(null, true);
          if (definition === "exit") (onExited as any)?.(null);
        }}
      >
        {children}
      </motion.div>
    );
  }
);

export default DialogTransition;
