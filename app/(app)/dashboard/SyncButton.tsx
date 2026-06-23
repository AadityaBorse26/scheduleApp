"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/Toast";

interface SyncButtonProps {
  userId: string;
  isSyncActive: boolean;
}

export default function SyncButton({ userId, isSyncActive }: SyncButtonProps) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSync = async () => {
    if (!isSyncActive) return;
    
    setIsSyncing(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/sync/${userId}`, {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const msg = data.message || "Calendar synchronized successfully!";
        setFeedback({
          text: msg,
          type: "success",
        });
        toast(msg, "success");
        router.refresh();
      } else {
        const err = data.error || "Failed to synchronize calendar events.";
        setFeedback({
          text: err,
          type: "error",
        });
        toast(err, "error");
        if (data.reconnectRequired) {
          // If token was revoked, reload page to update the dashboard's visual status
          router.refresh();
        }
      }
    } catch (err) {
      console.error("Sync error:", err);
      const connErr = "A connection error occurred. Please try again.";
      setFeedback({
        text: connErr,
        type: "error",
      });
      toast(connErr, "error");
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isSyncActive) {
    return (
      <div className="text-[11px] text-slate-500 mt-2 italic text-left">
        Sync disabled. Connect Google Calendar in settings to enable synchronization.
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3 mt-4">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white transition-all shadow-md active:scale-95 flex items-center space-x-1.5"
        >
          {isSyncing ? (
            <>
              <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <span>🔄</span>
              <span>Sync now</span>
            </>
          )}
        </button>

        <span className="text-[10px] text-slate-500 text-right leading-tight max-w-[160px]">
          * Calendar syncing is manual for now (cron job support coming soon).
        </span>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-[11px] leading-relaxed text-center ${
            feedback.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
              : "border-rose-500/20 bg-rose-500/5 text-rose-400"
          }`}
        >
          {feedback.text}
        </div>
      )}
    </div>
  );
}
