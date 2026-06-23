import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const name = profile?.name || user.email?.split("@")[0] || "User";
  const isSyncActive = !!(profile?.calendar_sync_enabled && profile?.google_refresh_token);

  return (
    <div className="flex flex-col space-y-10 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-300">
            Welcome back, {name}!
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Here&apos;s a summary of your scheduling status and calendar integrations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/availability"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/10 hover:-translate-y-0.5 active:scale-95"
          >
            ✏️ Edit Availability
          </Link>
          <Link
            href="/group"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all hover:-translate-y-0.5 active:scale-95"
          >
            👥 Group Rooms
          </Link>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sync Status Card */}
        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-300">Google Calendar</span>
              {isSyncActive ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              {isSyncActive
                ? "Google Calendar is actively connected. Busy time blocks are automatically imported to protect you from scheduling overlaps."
                : "Calendar sync is currently inactive. Set up Google Calendar to overlay your schedules and avoid double bookings."}
            </p>
          </div>
          <Link
            href="/settings"
            className="w-full text-center px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors"
          >
            {isSyncActive ? "Configure Integration" : "Connect Calendar"}
          </Link>
        </div>

        {/* Weekly Availability Card */}
        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-300">Weekly Schedule</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Setup Complete
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Define your recurring available slots. Friends can select any open slot on your shared coordinator layout during these periods.
            </p>
          </div>
          <Link
            href="/availability"
            className="w-full text-center px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors"
          >
            View Weekly Grid
          </Link>
        </div>

        {/* Group Coordinator Card */}
        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-300">Group Scheduling</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                Collaborative
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Create or join group scheduling spaces to overlay schedules and locate common meeting windows with multiple friends.
            </p>
          </div>
          <Link
            href="/group"
            className="w-full text-center px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors"
          >
            Manage Group Rooms
          </Link>
        </div>
      </div>

      {/* Guide Area */}
      <div className="p-8 rounded-3xl border border-slate-900 bg-slate-900/5 backdrop-blur-sm shadow-xl">
        <h3 className="text-lg font-bold text-slate-200 mb-2">Getting Started Guide</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-6 max-w-2xl">
          To get the most out of FriendScheduler, we recommend connecting your Google Calendar first.
          Then, go to the Weekly Schedule page to specify your default available slots. Finally, create a Group Room to invite friends and coordinate plans.
        </p>
        <div className="flex flex-wrap gap-6 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="flex w-5 h-5 items-center justify-center rounded-full bg-slate-900 text-[10px] border border-slate-800 font-semibold">1</span>
            <span>Connect calendar in Settings</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="flex w-5 h-5 items-center justify-center rounded-full bg-slate-900 text-[10px] border border-slate-800 font-semibold">2</span>
            <span>Configure availability open hours</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="flex w-5 h-5 items-center justify-center rounded-full bg-slate-900 text-[10px] border border-slate-800 font-semibold">3</span>
            <span>Share group coordinator link</span>
          </div>
        </div>
      </div>
    </div>
  );
}
