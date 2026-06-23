import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-col space-y-10 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-300">
          Settings &amp; Help
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure integrations, manage your account, and learn how the app works.
        </p>
      </div>

      {/* Settings Form (Google Calendar + profile) */}
      <SettingsForm
        profile={profile || null}
        email={user.email || ""}
      />

      {/* ── Setup Guide ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-sm font-bold text-slate-200">Getting Started</h2>
          <p className="text-xs text-slate-500 mt-0.5">Follow these steps to get the most out of FriendScheduler.</p>
        </div>
        <div className="divide-y divide-slate-800/60">
          {[
            {
              step: "1",
              title: "Connect your Google Calendar",
              desc: "Allows FriendScheduler to read your busy periods and automatically block them in group scheduling views. Your events are never stored on our servers — only start/end times.",
              action: { label: "Connect in Settings above ↑", href: "#" },
              icon: "📅",
            },
            {
              step: "2",
              title: "Set your weekly availability pattern",
              desc: "Tell the app your typical available hours for each day of the week. This becomes your default schedule — you can override individual dates at any time.",
              action: { label: "Edit weekly pattern →", href: "/availability/recurring" },
              icon: "🗓️",
            },
            {
              step: "3",
              title: "Add date overrides when needed",
              desc: "Travelling? Day off? Use the availability calendar to mark specific dates as available or unavailable, overriding your weekly defaults.",
              action: { label: "Open availability calendar →", href: "/availability/calendar" },
              icon: "📌",
            },
            {
              step: "4",
              title: "Use Group Space to find meeting times",
              desc: "The Group Space overlays everyone's availability into a colour-coded heatmap. Click any cell to see exactly who's free. Green = most people free, red = most people busy.",
              action: { label: "Open group space →", href: "/group" },
              icon: "👥",
            },
          ].map(item => (
            <div key={item.step} className="px-6 py-5 flex items-start gap-4">
              <div className="w-8 h-8 shrink-0 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-base">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Step {item.step}</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-200">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">{item.desc}</p>
                {item.href !== "#" && (
                  <Link href={item.href} className="inline-block mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                    {item.action.label}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-sm font-bold text-slate-200">How It Works</h2>
        </div>
        <div className="px-6 py-5 space-y-4 text-xs text-slate-400 leading-relaxed">
          <p>
            <span className="font-semibold text-slate-300">Availability Layers:</span>{" "}
            Your schedule is built in layers. Your <em>weekly recurring pattern</em> is the base. <em>Date overrides</em> sit on top for specific days. Finally, <em>Google Calendar busy blocks</em> are overlaid automatically when sync is enabled.
          </p>
          <p>
            <span className="font-semibold text-slate-300">Group Heatmap:</span>{" "}
            The Group Space fetches availability for all users and computes how many people are free in each 1-hour window. Colours range from 🔴 red (few free) through 🟠 orange, 🟡 yellow, to 🟢 green (most free). Click any cell for a detailed free/busy breakdown.
          </p>
          <p>
            <span className="font-semibold text-slate-300">Privacy:</span>{" "}
            Google Calendar data is used only to generate free/busy signals. Event titles, descriptions, and attendees are never stored.
          </p>
        </div>
      </div>

    </div>
  );
}
