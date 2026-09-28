"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Toast, type ToastItem, type ToastType } from "./Toast";

type ToastContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let nextToastId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastsRef = useRef<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const item: ToastItem = { id: nextToastId++, message, type };
    toastsRef.current = [...toastsRef.current, item];
    setToasts([...toastsRef.current]);
  }, []);

  const dismiss = useCallback((id: number) => {
    toastsRef.current = toastsRef.current.filter((t) => t.id !== id);
    setToasts([...toastsRef.current]);
  }, []);

  const ctx: ToastContextValue = useMemo(() => ({
    success: (msg) => addToast("success", msg),
    error: (msg) => addToast("error", msg),
    info: (msg) => addToast("info", msg),
  }), [addToast]);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {toasts.length > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+100px)] z-[200] flex flex-col items-center gap-2 px-5">
          <div className="pointer-events-auto w-full max-w-[400px] space-y-2">
            {toasts.map((item) => (
              <Toast key={item.id} item={item} onDismiss={dismiss} />
            ))}
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);

  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return ctx;
}
