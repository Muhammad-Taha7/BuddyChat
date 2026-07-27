import React, { createContext, useContext, useState, useCallback } from "react";
import Dialog from "./Dialog";

// ─── Context ──────────────────────────────────────────────
const DialogContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────
export const DialogProvider = ({ children }) => {
  const [dialogs, setDialogs] = useState([]);

  const showDialog = useCallback(
    ({
      type = "info",
      title,
      message,
      confirmText,
      cancelText,
      hideCancel,
      autoClose,
      onConfirm,
      onClose,
    }) => {
      const id = Date.now() + Math.random();
      setDialogs((prev) => [
        ...prev,
        {
          id,
          isOpen: true,
          type,
          title,
          message,
          confirmText,
          cancelText,
          hideCancel,
          autoClose,
          onConfirm,
          onClose,
        },
      ]);
      return id;
    },
    []
  );

  // Convenience shortcuts
  const showSuccess = useCallback(
    (title, message, options = {}) =>
      showDialog({ type: "success", title, message, hideCancel: true, autoClose: 2500, ...options }),
    [showDialog]
  );

  const showError = useCallback(
    (title, message, options = {}) =>
      showDialog({ type: "error", title, message, hideCancel: true, ...options }),
    [showDialog]
  );

  const showConfirm = useCallback(
    (title, message, onConfirm, options = {}) =>
      showDialog({ type: "confirm-danger", title, message, onConfirm, confirmText: "Delete", cancelText: "Cancel", ...options }),
    [showDialog]
  );

  const showWarning = useCallback(
    (title, message, onConfirm, options = {}) =>
      showDialog({ type: "warning", title, message, onConfirm, confirmText: "Proceed", cancelText: "Cancel", ...options }),
    [showDialog]
  );

  const closeDialog = useCallback((id) => {
    setDialogs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isOpen: false } : d))
    );
    // Remove after animation
    setTimeout(() => {
      setDialogs((prev) => prev.filter((d) => d.id !== id));
    }, 300);
  }, []);

  return (
    <DialogContext.Provider
      value={{ showDialog, showSuccess, showError, showConfirm, showWarning }}
    >
      {children}
      {dialogs.map((dialog) => (
        <Dialog
          key={dialog.id}
          isOpen={dialog.isOpen}
          onClose={() => {
            closeDialog(dialog.id);
            dialog.onClose?.();
          }}
          type={dialog.type}
          title={dialog.title}
          message={dialog.message}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
          hideCancel={dialog.hideCancel}
          autoClose={dialog.autoClose}
          onConfirm={dialog.onConfirm}
        />
      ))}
    </DialogContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────
export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return ctx;
};

export default DialogProvider;
