"use client";

import * as React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Slide, { type SlideProps } from "@mui/material/Slide";

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: number;
  message: string;
  variant: ToastVariant;
}

type Listener = (message: string, variant: ToastVariant) => void;

let listener: Listener | null = null;
let queueBeforeMount: { message: string; variant: ToastVariant }[] = [];

function emit(message: string, variant: ToastVariant) {
  if (listener) listener(message, variant);
  else queueBeforeMount.push({ message, variant });
}

/**
 * Drop-in replacement for `sonner`'s `toast` export — same `toast.success/error/info` call
 * shape used throughout the app, backed by an MUI Snackbar+Alert stack instead of sonner's
 * own renderer, so call sites didn't need to change beyond the import path.
 */
export const toast = {
  success: (message: string) => emit(message, "success"),
  error: (message: string) => emit(message, "error"),
  info: (message: string) => emit(message, "info"),
  warning: (message: string) => emit(message, "warning"),
};

function SlideDown(props: SlideProps) {
  return <Slide {...props} direction="down" />;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);
  const idRef = React.useRef(0);

  React.useEffect(() => {
    listener = (message, variant) => {
      idRef.current += 1;
      setToasts((prev) => [...prev, { id: idRef.current, message, variant }]);
    };
    if (queueBeforeMount.length) {
      queueBeforeMount.forEach(({ message, variant }) => listener?.(message, variant));
      queueBeforeMount = [];
    }
    return () => {
      listener = null;
    };
  }, []);

  function handleClose(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <>
      {children}
      {toasts.map((t, index) => (
        <Snackbar
          key={t.id}
          open
          autoHideDuration={3200}
          onClose={() => handleClose(t.id)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          slots={{ transition: SlideDown }}
          sx={{ top: `${16 + index * 62}px !important` }}
        >
          <Alert
            onClose={() => handleClose(t.id)}
            severity={t.variant}
            variant="filled"
            sx={{ minWidth: 280, boxShadow: 3 }}
          >
            {t.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
}
