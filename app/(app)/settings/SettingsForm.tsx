/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useTransition } from "react";
import { disconnectGoogleCalendar, updateProfile } from "@/app/auth/actions";
import { toast } from "@/components/Toast";

interface SettingsFormProps {
  profile: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    timezone: string;
    google_refresh_token: string | null;
    calendar_sync_enabled: boolean;
    last_synced_at: string | null;
  } | null;
  email: string;
}

const TIMEZONES = [
  { value: "America/Los_Angeles", label: "Pacific Time (PT) - Los Angeles" },
  { value: "America/Denver", label: "Mountain Time (MT) - Denver" },
  { value: "America/Chicago", label: "Central Time (CT) - Chicago" },
  { value: "America/New_York", label: "Eastern Time (ET) - New York" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT) - London" },
  { value: "Europe/Paris", label: "Central European Time (CET) - Paris" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST) - Tokyo" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST) - Kolkata" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET) - Sydney" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)" }
];

export default function SettingsForm({ profile, email }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isTimezonePending, startTimezoneTransition] = useTransition();
  const [isNamePending, startNameTransition] = useTransition();

  // Internal states
  const [name, setName] = useState(profile?.name || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(name);
  
  const [timezone, setTimezone] = useState(profile?.timezone || "America/Los_Angeles");
  const [syncEnabled, setSyncEnabled] = useState(!!profile?.google_refresh_token && profile?.calendar_sync_enabled);
  const [lastSyncedAt, setLastSyncedAt] = useState(profile?.last_synced_at || null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Disconnect Google action
  const handleDisconnect = async () => {
    setMessage(null);
    startTransition(async () => {
      const res = await disconnectGoogleCalendar();
      if (res.success) {
        setSyncEnabled(false);
        setLastSyncedAt(null);
        setMessage({
          text: "Google Calendar has been disconnected. Your calendar sync is now disabled.",
          type: "success"
        });
        toast("Google Calendar disconnected successfully.", "success");
      } else {
        setMessage({
          text: res.error || "An error occurred while disconnecting.",
          type: "error"
        });
        toast(res.error || "Failed to disconnect Google Calendar.", "error");
      }
    });
  };

  // Timezone change action
  const handleTimezoneChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTimezone = e.target.value;
    setTimezone(newTimezone);
    setMessage(null);

    startTimezoneTransition(async () => {
      const res = await updateProfile({ timezone: newTimezone });
      if (res.success) {
        setMessage({
          text: `Your timezone has been updated to ${newTimezone}.`,
          type: "success"
        });
        toast(`Timezone updated to ${newTimezone}.`, "success");
      } else {
        setMessage({
          text: res.error || "Failed to update timezone.",
          type: "error"
        });
        toast(res.error || "Failed to update timezone.", "error");
        // Revert to initial state
        setTimezone(profile?.timezone || "America/Los_Angeles");
      }
    });
  };

  // Name update save action
  const handleSaveName = async () => {
    if (!tempName.trim()) {
      setMessage({ text: "Name cannot be empty.", type: "error" });
      toast("Name cannot be empty.", "error");
      return;
    }

    setMessage(null);
    startNameTransition(async () => {
      const res = await updateProfile({ name: tempName });
      if (res.success) {
        setName(tempName);
        setIsEditingName(false);
        setMessage({
          text: "Your profile name has been updated.",
          type: "success"
        });
        toast("Profile name updated successfully.", "success");
      } else {
        setMessage({
          text: res.error || "Failed to update name.",
          type: "error"
        });
        toast(res.error || "Failed to update name.", "error");
      }
    });
  };

  // Formatter for synced time
  const formatSyncedTime = (timeStr: string | null) => {
    if (!timeStr) return "Never synced";
    const date = new Date(timeStr);
    return date.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  return (
    <div className="w-full max-w-2xl flex flex-col space-y-6 animate-fade-in">
      
      {/* 1. Profile Overview Card */}
      <div className="bg-slate-900/10 border border-slate-900 rounded-3xl p-6 backdrop-blur-sm shadow-xl flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
        
        {/* Avatar Area */}
        <div className="relative group">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={name || "User profile"}
              className="w-20 h-20 rounded-full border-2 border-indigo-500/35 object-cover shadow-lg transition-transform group-hover:scale-102"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-2xl font-bold text-slate-350 shadow-lg">
              {(name || "U")[0].toUpperCase()}
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-5 h-5 bg-indigo-500 rounded-full border-2 border-slate-950 flex items-center justify-center text-[10px]">
            👤
          </span>
        </div>

        {/* Details & Edit Inline Name Form */}
        <div className="flex-1 space-y-3 text-center sm:text-left w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {isEditingName ? (
              <div className="flex items-center space-x-2 w-full sm:max-w-md">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  disabled={isNamePending}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
                  placeholder="Enter name"
                />
                <button
                  onClick={handleSaveName}
                  disabled={isNamePending}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
                >
                  {isNamePending ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setTempName(name);
                    setIsEditingName(false);
                  }}
                  disabled={isNamePending}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-350 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start space-x-2.5 group">
                <h3 className="text-xl font-bold text-slate-100 tracking-tight leading-none">
                  {name || "Unnamed Scheduler"}
                </h3>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-slate-500 hover:text-slate-300 text-xs p-1 rounded transition-colors"
                  title="Edit Name"
                >
                  ✏️
                </button>
              </div>
            )}
            
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit mx-auto sm:mx-0">
              Member
            </span>
          </div>

          <p className="text-xs text-slate-400 font-medium pl-0.5">{email}</p>

          <div className="pt-2 border-t border-slate-850/50 flex flex-col space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider pl-0.5">Timezone Settings</span>
            <div className="relative w-full sm:max-w-xs flex items-center">
              <select
                value={timezone}
                onChange={handleTimezoneChange}
                disabled={isTimezonePending}
                className="w-full bg-slate-950/80 border border-slate-850 hover:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50 appearance-none cursor-pointer"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value} className="bg-slate-950 text-slate-300">
                    {tz.label}
                  </option>
                ))}
              </select>
              {isTimezonePending && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2">
                  <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin block"></span>
                </div>
              )}
              <span className="absolute right-3.5 pointer-events-none text-[10px] text-slate-500">▼</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Integration & Status Card */}
      <div className="bg-slate-900/10 border border-slate-900 rounded-3xl p-8 backdrop-blur-sm shadow-xl flex flex-col space-y-6">
        
        {/* Header and status display */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-900 gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <span>📅</span>
              <span>Google Calendar Sync</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Synchronize availability from Google Calendar to block off busy hours.
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2">
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
            
            <div className="text-[10px] text-slate-400 flex items-center space-x-1 pl-1">
              <span>Last Synced:</span>
              <span className="font-semibold text-slate-300">{formatSyncedTime(lastSyncedAt)}</span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        {syncEnabled ? (
          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-indigo-300 leading-relaxed flex items-start space-x-2">
            <span className="text-sm mt-0.5">🚀</span>
            <p>
              <strong>Live Sync Active:</strong> We read busy schedules from your connected calendar. Events are fetched securely on the server-side, protecting personal details from other members.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-950 text-xs text-slate-400 leading-relaxed flex items-start space-x-2">
            <span className="text-sm mt-0.5">🔒</span>
            <p>
              <strong>Calendar Offline:</strong> To enable synchronization again, sign out and sign back in using your Google account while granting the Calendar access permission.
            </p>
          </div>
        )}

        {/* Message Alert */}
        {message && (
          <div
            className={`p-4 rounded-2xl border text-xs leading-relaxed text-center animate-fade-in ${
              message.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                : "border-rose-500/20 bg-rose-500/5 text-rose-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Disconnect trigger */}
        <div className="flex items-center justify-between pt-4">
          <div>
            <span className="block text-sm font-semibold text-slate-350">
              {syncEnabled ? "Revoke Integration" : "No Integration Active"}
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
