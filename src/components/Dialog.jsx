import React, { useEffect, useState } from "react";
import { X, AlertTriangle, Info, CheckCircle, AlertCircle } from "lucide-react";

// ─── Animated Green Tick SVG ─────────────────────────────
const AnimatedTick = () => (
  <svg
    className="w-8 h-8 text-emerald-500"
    viewBox="0 0 52 52"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Circle */}
    <circle
      cx="26"
      cy="26"
      r="24"
      stroke="currentColor"
      strokeWidth="3"
      fill="none"
      className="animate-draw-circle"
      style={{
        strokeDasharray: 150,
        strokeDashoffset: 150,
        animation: "drawCircle 0.5s ease forwards",
      }}
    />
    {/* Checkmark */}
    <path
      d="M14.5 26L22 34L37.5 18"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        strokeDasharray: 40,
        strokeDashoffset: 40,
        animation: "drawCheck 0.4s ease 0.4s forwards",
      }}
    />
  </svg>
);

// ─── Icon by type ─────────────────────────────────────────
const TypeIcon = ({ type }) => {
  if (type === "success") return <AnimatedTick />;
  if (type === "error")
    return (
      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
        <AlertCircle size={22} className="text-red-500" />
      </div>
    );
  if (type === "warning")
    return (
      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
        <AlertTriangle size={22} className="text-amber-500" />
      </div>
    );
  if (type === "confirm-danger")
    return (
      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
        <Trash2 size={20} className="text-red-500" />
      </div>
    );
  return (
    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
      <Info size={22} className="text-blue-500" />
    </div>
  );
};

// ─── Main Dialog Component ───────────────────────────────
const Dialog = ({
  isOpen,
  onClose,
  title,
  message,
  children,
  type = "info",
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  hideCancel = false,
  autoClose = false, // ms to auto-close (for success dialogs)
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";

      // Auto-close for success dialogs
      if (autoClose && autoClose > 0) {
        const timer = setTimeout(() => handleClose(), autoClose);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, autoClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 200);
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    handleClose();
  };

  const handleBackdropClick = (e) => {
    // Don't close on backdrop click for danger confirmations
    if (type === "confirm-danger") return;
    if (e.target === e.currentTarget) handleClose();
  };

  if (!isOpen) return null;

  const isDanger = type === "error" || type === "confirm-danger";
  const isSuccess = type === "success";

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white w-full sm:rounded-2xl sm:max-w-md shadow-2xl border border-gray-100 transform transition-all duration-300 ${
          isVisible
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-8 opacity-0 scale-95"
        }`}
        style={{
          // Mobile: bottom sheet
          borderRadius: "20px 20px 0 0",
        }}
        // Override for sm+
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <TypeIcon type={type} />
            <h3 className="text-lg font-bold text-gray-900 leading-tight">{title}</h3>
          </div>
          {!isDanger && (
            <button
              onClick={handleClose}
              className="ml-2 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-6" />

        {/* Content */}
        {(message || children) && (
          <div className="px-6 py-4">
            {message && (
              <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
            )}
            {children}
          </div>
        )}

        {/* Actions */}
        <div
          className={`flex gap-3 px-6 pb-6 pt-2 ${
            isSuccess ? "justify-center" : "flex-col sm:flex-row"
          }`}
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          {/* For success type with no confirm — just a close button */}
          {isSuccess && !onConfirm && (
            <button
              onClick={handleClose}
              className="px-8 py-2.5 rounded-xl font-semibold text-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-200"
            >
              {cancelText === "Cancel" ? "Great!" : cancelText}
            </button>
          )}

          {/* Confirm button (for non-success types) */}
          {onConfirm && !isSuccess && (
            <button
              onClick={handleConfirm}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDanger
                  ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm shadow-red-200"
                  : "bg-black text-white hover:bg-gray-800 focus:ring-gray-500"
              }`}
            >
              {confirmText}
            </button>
          )}

          {/* Success with confirm button */}
          {onConfirm && isSuccess && (
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm"
            >
              {confirmText}
            </button>
          )}

          {/* Cancel button */}
          {!hideCancel && (
            <button
              onClick={handleClose}
              className={`${
                isSuccess
                  ? "hidden"
                  : "flex-1 py-3 px-4 rounded-xl font-semibold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              }`}
            >
              {cancelText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dialog;