"use client";

import React, { useState, useTransition } from "react";
import { disconnectGoogleCalendar } from "@/app/auth/actions";

interface SettingsFormProps {
  initialSyncEnabled: boolean;
  hasRefreshToken: boolean;
}

export default function SettingsForm({ initialSyncEnabled, hasRefreshToken }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [syncEnabled, setSyncEnabled] = useState(initialSyncEnabled && hasRefreshToken);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleDisconnect = async () => {
    setMessage(null);
    
    startTransition(async () => {
      const res = await disconnectGoogleCalendar();
      if (res.success) {
        setSyncEnabled(false);
        setMessage({
          text: "Google Calendar has been disconnected. Your calendar sync is now disabled.",
          type: "success"
        });
      } else {
        setMessage({
          text: res.error || "An error occurred while disconnecting.",
          type: "error"
        });
      }
    });
  };

  return (
    <div className="w-full max-w-2xl bg-slate-900/10 border border-slate-900 rounded-3xl p-8 backdrop-blur-sm shadow-2xl relative">
      <div className="flex flex-col space-y-6">
        
        {/* Status Indicator Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-900 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 mb-1">Google Calendar Sync</h2>
            <p className="text-xs text-slate-400 max-w-md">
              Synchronize your availability calendar with events from Google Calendar to automatically avoid double bookings.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">Status:</span>
            {syncEnabled ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-slate-400 border border-slate-800">
                Disconnected
              </span>
            )}
          </div>
        </div>

        {/* Info Box */}
        {syncEnabled ? (
          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-indigo-300 leading-relaxed">
            🚀 <strong>Live Sync Active:</strong> We read busy schedules from your synced Google Calendar account. Events are fetched securely on the server-side, protecting your personal details from public visibility.
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-950 text-xs text-slate-400 leading-relaxed">
            🔒 <strong>Calendar Offline:</strong> To enable synchronization again, sign out and sign back in using your Google account while granting the Calendar access permission.
          </div>
        )}

        {/* Message Alert */}
        {message && (
          <div
            className={`p-4 rounded-2xl border text-xs leading-relaxed text-center ${
              message.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                : "border-rose-500/20 bg-rose-500/5 text-rose-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Control Button Area */}
        <div className="flex items-center justify-between pt-4">
          <div>
            <span className="block text-sm font-semibold text-slate-300">
              {syncEnabled ? "Revoke Access" : "No Integration Active"}
            </span>
            <span className="block text-[11px] text-slate-500 max-w-[280px] mt-0.5">
              {syncEnabled
                ? "This will clear your Google refresh token from our database immediately."
                : "Your Google refresh token has been disconnected."}
            </span>
          </div>

          <button
            onClick={handleDisconnect}
            disabled={!syncEnabled || isPending}
            className="px-5 py-3 rounded-xl text-xs font-semibold bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-rose-400 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.97] flex items-center space-x-1.5 shadow-md shadow-rose-950/20"
          >
            {isPending ? (
              <>
                <span className="w-3.5 h-3.5 border border-rose-400 border-t-transparent rounded-full animate-spin"></span>
                <span>Disconnecting...</span>
              </>
            ) : (
              <>
                <span>🚫</span>
                <span>Disconnect Google Calendar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
