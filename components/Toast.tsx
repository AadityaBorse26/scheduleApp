"use client";

import React, { useState, useEffect } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  text: string;
  type: ToastType;
}

type ToastListener = (text: string, type: ToastType) => void;

const listeners = new Set<ToastListener>();

/**
 * Global toast emitter function. Can be called from client components.
 */
export function toast(text: string, type: ToastType = "success") {
  listeners.forEach((listener) => listener(text, type));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast: ToastListener = (text, type) => {
      const id = Math.random().toString(36).substring(2);
      setToasts((prev) => [...prev, { id, text, type }]);
      
      // Auto-dismiss after 3.5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    };

    listeners.add(handleToast);
    return () => {
      listeners.delete(handleToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-5 right-5 z-[99999] flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          className={`pointer-events-auto cursor-pointer p-4 rounded-2xl border shadow-2xl flex items-center justify-between text-xs leading-relaxed animate-fade-in transition-all duration-300 hover:scale-[1.01] ${
            t.type === "success"
              ? "border-emerald-500/25 bg-emerald-950/90 text-emerald-250 backdrop-blur-md"
              : t.type === "error"
              ? "border-rose-500/25 bg-rose-950/90 text-rose-250 backdrop-blur-md"
              : "border-slate-800 bg-slate-900/90 text-slate-200 backdrop-blur-md"
          }`}
          style={{
            animation: "slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          <div className="flex items-center space-x-2.5">
            <span className="text-sm">
              {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}
            </span>
            <span className="font-semibold">{t.text}</span>
          </div>
          <button className="text-[10px] text-slate-500 hover:text-slate-350 ml-4 font-bold">
            ✕
          </button>
        </div>
      ))}

      {/* Global CSS animation definitions */}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateY(1.5rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
