"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

const typeStyles: Record<ToastType, string> = {
  success: "bg-[#EAF4EC] text-[#2E7D32] border-[#C8E6C9]",
  error: "bg-[#FCE8EA] text-[#C9182B] border-[#F8BBD0]",
  info: "bg-white text-[#4B3D3B] border-[#EFE7E5]",
};

const typeIcons: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

export function Toast({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(item.id), 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <div
      className={`flex items-center gap-3 rounded-[14px] border px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 ${
        typeStyles[item.type]
      } ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/60 text-[12px] font-bold">
        {typeIcons[item.type]}
      </span>
      <p className="min-w-0 flex-1 text-[14px] font-medium leading-snug">
        {item.message}
      </p>
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          setTimeout(() => onDismiss(item.id), 300);
        }}
        className="shrink-0 text-current opacity-50 transition active:scale-95 hover:opacity-80"
      >
        <X size={16} />
      </button>
    </div>
  );
}
