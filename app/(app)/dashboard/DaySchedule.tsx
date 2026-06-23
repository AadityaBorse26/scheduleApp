"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecurringPattern {
  day_of_week: number; // 0=Sun
  start_time: string;  // "HH:MM:SS"
  end_time: string;
}

interface DateOverride {
  date: string;        // "YYYY-MM-DD"
  type: "available" | "unavailable";
  start_time: string | null;
  end_time: string | null;
}

interface BusyBlock {
  start_time: string; // ISO
  end_time: string;
}

interface TimeBlock {
  startH: number; // 0–24 float
  endH: number;
  type: "free" | "busy" | "unavailable";
  label: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeStrToH(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

function isoToH(iso: string): number {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}

function formatH(h: number): string {
  const hour = Math.floor(h);
  const min = Math.round((h - hour) * 60);
  const ampm = hour < 12 ? "am" : "pm";
  const displayH = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return min === 0 ? `${displayH}${ampm}` : `${displayH}:${min.toString().padStart(2, "0")}${ampm}`;
}

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function greetingFor(name: string): string {
  const h = new Date().getHours();
  const part = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  return `Good ${part}, ${name}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

const DISPLAY_START = 8;  // 8am
const DISPLAY_END   = 23; // 11pm

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  name: string;
  isSyncActive: boolean;
  hasPatterns: boolean;
}

export default function DaySchedule({ userId, name, isSyncActive, hasPatterns }: Props) {
  const [patterns, setPatterns] = useState<RecurringPattern[]>([]);
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [busyBlocks, setBusyBlocks] = useState<BusyBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const todayStr = todayDateStr();
  const todayDow = today.getDay();

  useEffect(() => {
    async function load() {
      const [{ data: pat }, { data: ov }, { data: bb }] = await Promise.all([
        supabase.from("recurring_availability").select("day_of_week,start_time,end_time").eq("user_id", userId),
        supabase.from("date_overrides").select("date,type,start_time,end_time").eq("user_id", userId),
        supabase.from("synced_busy_blocks").select("start_time,end_time").eq("user_id", userId)
          .gte("end_time", new Date(today.setHours(0,0,0,0)).toISOString())
          .lte("start_time", new Date(today.setHours(23,59,59,999)).toISOString()),
      ]);
      setPatterns(pat ?? []);
      setOverrides(ov ?? []);
      setBusyBlocks(bb ?? []);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Build timeline blocks for today
  const blocks = useMemo<TimeBlock[]>(() => {
    const result: TimeBlock[] = [];

    // Check if today has an override
    const todayOverrides = overrides.filter(o => o.date === todayStr);
    const hasUnavailableDay = todayOverrides.some(o => o.type === "unavailable" && !o.start_time);

    if (hasUnavailableDay) {
      result.push({ startH: DISPLAY_START, endH: DISPLAY_END, type: "unavailable", label: "Unavailable all day" });
      return result;
    }

    // Start with recurring patterns for today
    const todayPatterns = patterns
      .filter(p => p.day_of_week === todayDow)
      .map(p => ({ startH: timeStrToH(p.start_time), endH: timeStrToH(p.end_time), type: "free" as const, label: "Available" }));

    // Override available windows
    const availOverrides = todayOverrides
      .filter(o => o.type === "available" && o.start_time)
      .map(o => ({ startH: timeStrToH(o.start_time!), endH: timeStrToH(o.end_time!), type: "free" as const, label: "Available (override)" }));

    // Override unavailable windows
    const unavailOverrides = todayOverrides
      .filter(o => o.type === "unavailable" && o.start_time)
      .map(o => ({ startH: timeStrToH(o.start_time!), endH: timeStrToH(o.end_time!), type: "unavailable" as const, label: "Blocked" }));

    // Google busy blocks
    const googleBlocks: TimeBlock[] = busyBlocks.map(b => ({
      startH: Math.max(isoToH(b.start_time), 0),
      endH: Math.min(isoToH(b.end_time), 24),
      type: "busy",
      label: "Busy (Calendar)",
    }));

    // Merge: patterns + available overrides as free, then punch holes with busy/unavailable
    const freeWindows = [...todayPatterns, ...availOverrides];
    const blockers = [...unavailOverrides, ...googleBlocks];

    // Simple merge: add free windows, then overlay busy on top
    result.push(...freeWindows, ...blockers);

    return result.sort((a, b) => a.startH - b.startH);
  }, [patterns, overrides, busyBlocks, todayStr, todayDow]);

  // Current status
  const currentH = today.getHours() + today.getMinutes() / 60;
  const currentBlock = blocks.find(b => currentH >= b.startH && currentH < b.endH);
  const nextFree = blocks.find(b => b.type === "free" && b.startH > currentH);
  const nextBusy = blocks.find(b => b.type === "busy" && b.startH > currentH);

  const statusLabel = currentBlock?.type === "free"
    ? "Available Now"
    : currentBlock?.type === "busy"
    ? `Busy until ${formatH(currentBlock.endH)}`
    : currentBlock?.type === "unavailable"
    ? "Unavailable"
    : "No schedule set";

  const statusColor = currentBlock?.type === "free"
    ? "text-green-400 bg-green-500/10 border-green-500/30"
    : currentBlock?.type === "busy"
    ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
    : "text-slate-400 bg-slate-800/40 border-slate-700/30";

  // Available hours today
  const totalFreeH = blocks
    .filter(b => b.type === "free" && b.endH > currentH)
    .reduce((sum, b) => sum + (Math.min(b.endH, DISPLAY_END) - Math.max(b.startH, currentH)), 0);

  const totalRange = DISPLAY_END - DISPLAY_START;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 rounded-2xl bg-slate-900/40" />
        <div className="h-48 rounded-2xl bg-slate-900/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Google Calendar Banner (only if not connected) ── */}
      {!isSyncActive && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-xs text-indigo-300">
          <span className="text-base">📅</span>
          <span className="flex-1">
            <span className="font-semibold">Connect Google Calendar</span> to automatically block your busy times.
          </span>
          <Link href="/settings" className="shrink-0 font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
            Connect →
          </Link>
        </div>
      )}

      {/* ── Hero ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-300">
            {greetingFor(name)}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{formatDate(new Date())}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${statusColor}`}>
            <span className={`w-2 h-2 rounded-full ${currentBlock?.type === "free" ? "bg-green-500 animate-pulse" : currentBlock?.type === "busy" ? "bg-amber-500" : "bg-slate-600"}`} />
            {statusLabel}
          </span>
          <Link
            href="/availability/calendar"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 hover:-translate-y-0.5 active:scale-95"
          >
            ✏️ Edit Availability
          </Link>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Today Timeline — 2/3 width */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/20 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200">Today's Schedule</h2>
            {isSyncActive && (
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Calendar synced
              </span>
            )}
          </div>

          {/* Timeline visual */}
          <div className="px-5 py-4">
            <div className="space-y-1">
              {/* Hour ruler + blocks */}
              <div className="relative" style={{ height: `${(DISPLAY_END - DISPLAY_START) * 32}px` }}>
                {/* Hour lines */}
                {Array.from({ length: DISPLAY_END - DISPLAY_START + 1 }, (_, i) => DISPLAY_START + i).map(h => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 flex items-center gap-2 pointer-events-none"
                    style={{ top: `${(h - DISPLAY_START) * 32}px` }}
                  >
                    <span className="w-10 text-right text-[10px] text-slate-600 shrink-0">{formatH(h)}</span>
                    <div className="flex-1 border-t border-slate-800/60" />
                  </div>
                ))}

                {/* Current time line */}
                {currentH >= DISPLAY_START && currentH <= DISPLAY_END && (
                  <div
                    className="absolute left-12 right-0 flex items-center z-20 pointer-events-none"
                    style={{ top: `${(currentH - DISPLAY_START) * 32}px` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-indigo-500 -ml-1" />
                    <div className="flex-1 border-t-2 border-indigo-500/60" />
                  </div>
                )}

                {/* No pattern hint — shown as a soft label, doesn't hide the grid */}
                {!hasPatterns && blocks.filter(b => b.type !== "busy").length === 0 && (
                  <div className="absolute left-12 right-0 top-2 flex items-center justify-center">
                    <div className="text-[11px] text-slate-600 italic bg-slate-950/60 px-3 py-1 rounded-lg">
                      No availability set —{" "}
                      <Link href="/availability/recurring" className="text-indigo-500 hover:text-indigo-400 font-medium">
                        set weekly pattern
                      </Link>
                    </div>
                  </div>
                )}

                {/* Schedule blocks */}
                {blocks
                  .filter(b => b.endH > DISPLAY_START && b.startH < DISPLAY_END)
                  .map((block, i) => {
                    const top = (Math.max(block.startH, DISPLAY_START) - DISPLAY_START) * 32;
                    const height = (Math.min(block.endH, DISPLAY_END) - Math.max(block.startH, DISPLAY_START)) * 32 - 2;
                    if (height <= 0) return null;

                    const colorClass =
                      block.type === "free" ? "bg-green-500/20 border-green-500/40 text-green-300" :
                      block.type === "busy" ? "bg-amber-500/20 border-amber-500/40 text-amber-300" :
                      "bg-slate-800/60 border-slate-700/40 text-slate-500";

                    return (
                      <div
                        key={i}
                        className={`absolute left-12 right-0 rounded-lg border px-2 flex items-center overflow-hidden ${colorClass}`}
                        style={{ top, height: Math.max(height, 20) }}
                      >
                        <span className="text-[10px] font-semibold truncate">
                          {block.label} · {formatH(block.startH)}–{formatH(block.endH)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar — stats + weekly */}
        <div className="space-y-4">

          {/* Today's Summary */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-200">Today's Summary</h2>

            <div className="space-y-3">
              {/* Free hours bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Available time remaining</span>
                  <span className="font-bold text-green-400">{totalFreeH.toFixed(1)}h</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400 transition-all"
                    style={{ width: `${Math.min((totalFreeH / (totalRange * 0.6)) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Next window */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="text-base mt-0.5">⏰</span>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Next available</div>
                  {nextFree ? (
                    <div className="text-xs font-semibold text-slate-200 mt-0.5">
                      {formatH(nextFree.startH)} – {formatH(nextFree.endH)}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 mt-0.5">No upcoming windows today</div>
                  )}
                </div>
              </div>

              {/* Next busy */}
              {nextBusy && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                  <span className="text-base mt-0.5">📅</span>
                  <div>
                    <div className="text-[11px] text-amber-500/80 font-medium uppercase tracking-wide">Next busy</div>
                    <div className="text-xs font-semibold text-amber-300 mt-0.5">
                      {formatH(nextBusy.startH)} – {formatH(nextBusy.endH)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Weekly Preview mini-grid */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-200">This Week</h2>
              <Link href="/availability/calendar" className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Full view →
              </Link>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {["S","M","T","W","T","F","S"].map((d, i) => {
                const isToday = i === today.getDay();
                const dayPatterns = patterns.filter(p => p.day_of_week === i);
                const hasFree = dayPatterns.length > 0;
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className={`text-[10px] font-medium ${isToday ? "text-indigo-400" : "text-slate-600"}`}>{d}</span>
                    <div className={`w-full aspect-square rounded-md ${
                      isToday
                        ? hasFree ? "bg-indigo-500/30 border border-indigo-500/50" : "bg-slate-800 border border-indigo-500/30"
                        : hasFree ? "bg-green-500/20 border border-green-500/25" : "bg-slate-900 border border-slate-800"
                    }`} />
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-600 mt-2">
              🟢 Days with availability set &nbsp;·&nbsp; 🔵 Today
            </p>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5 space-y-2">
            <h2 className="text-sm font-bold text-slate-200 mb-3">Quick Actions</h2>
            <Link href="/availability/recurring" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/60 transition-colors group">
              <span className="text-base">🗓️</span>
              <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">Edit weekly pattern</span>
            </Link>
            <Link href="/availability/calendar" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/60 transition-colors group">
              <span className="text-base">📌</span>
              <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">Add a date override</span>
            </Link>
            <Link href="/group" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/60 transition-colors group">
              <span className="text-base">👥</span>
              <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">View group availability</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
