import React, { useState } from "react";
import Button, { type ButtonProps } from "../Button/Button";
import ConfirmDialog from "../../molecules/ConfirmDialog/ConfirmDialog";

export interface ConfirmableButtonProps extends Omit<ButtonProps, "onClick"> {
  confirmTitle: string;
  confirmMessage: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  /** Runs before the confirm dialog opens — e.g. `e.stopPropagation()` on a table row's action button. */
  onClick?: (e: React.MouseEvent) => void;
}

// Wraps the click-button -> open-ConfirmDialog -> call-action-on-confirm boilerplate that
// was hand-wired at every "cancel booking / decline booking / delete record" call site.
// Manages its own open + loading state; if `onConfirm` throws (the caller is expected to
// have already surfaced the error, e.g. via a snackbar) the dialog stays open so the user
// can retry or back out, matching the behavior every hand-rolled version already had.
const ConfirmableButton: React.FC<ConfirmableButtonProps> = ({
  confirmTitle,
  confirmMessage,
  confirmLabel,
  cancelLabel,
  danger,
  onConfirm,
  onClick,
  children,
  ...buttonProps
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      // Error handling/snackbar is the caller's responsibility; keep the dialog open.
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        {...buttonProps}
        onClick={(e) => {
          onClick?.(e);
          setOpen(true);
        }}
      >
        {children}
      </Button>
      <ConfirmDialog
        open={open}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        danger={danger}
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
};

export default ConfirmableButton;
