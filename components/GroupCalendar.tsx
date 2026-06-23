/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/components/Toast";
import CalendarSkeleton from "@/components/CalendarSkeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  name: string | null;
  avatar_url?: string | null;
}

interface OverlapSlot {
  slotStart: string;
  slotEnd: string;
  freeCount: number;
  freeUserIds: string[];
}

interface PopoverState {
  slot: OverlapSlot;
  anchorRect: DOMRect;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8am – 11pm (hour blocks 8–22, each ending 1h later)
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  date.setDate(date.getDate() - date.getDay());
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function addWeeks(d: Date, n: number): Date {
  return addDays(d, n * 7);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatHour(h: number): string {
  if (h === 0) return "12am";
  if (h < 12) return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
}

/** Returns a Tailwind-compatible inline style for a heatmap cell based on ratio 0-1 */
function heatColor(freeCount: number, total: number): { bg: string; border: string; text: string; label: string } {
  if (total === 0 || freeCount === 0) {
    return {
      bg: "rgba(30,30,45,0.6)",
      border: "rgba(71,85,105,0.2)",
      text: "rgb(71,85,105)",
      label: "None",
    };
  }
  const ratio = freeCount / total;
  if (ratio < 0.25) {
    // Red
    return { bg: `rgba(239,68,68,${0.12 + ratio * 0.6})`, border: "rgba(239,68,68,0.35)", text: "rgb(254,202,202)", label: "Low" };
  } else if (ratio < 0.5) {
    // Orange
    return { bg: `rgba(249,115,22,${0.12 + ratio * 0.6})`, border: "rgba(249,115,22,0.40)", text: "rgb(254,215,170)", label: "Fair" };
  } else if (ratio < 0.75) {
    // Yellow
    return { bg: `rgba(234,179,8,${0.14 + ratio * 0.55})`, border: "rgba(234,179,8,0.45)", text: "rgb(254,240,138)", label: "Good" };
  } else {
    // Green
    return { bg: `rgba(34,197,94,${0.15 + ratio * 0.70})`, border: "rgba(34,197,94,0.55)", text: "rgb(187,247,208)", label: "Great" };
  }
}

/** Best free-ratio for a full day (used in month view) */
function bestRatioForDay(slots: OverlapSlot[], day: Date, total: number): number {
  const daySlots = slots.filter(s => isSameDay(new Date(s.slotStart), day));
  if (daySlots.length === 0) return 0;
  return Math.max(...daySlots.map(s => s.freeCount)) / total;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GroupCalendar() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [overlapSlots, setOverlapSlots] = useState<OverlapSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [view, setView] = useState<"week" | "month">("week");
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [monthStart, setMonthStart] = useState<Date>(() => startOfMonth(new Date()));
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const total = profiles.length;

  // Close popover on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Load profiles once
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const { data, error } = await supabase.from("profiles").select("id, name, avatar_url");
      if (!error && data) setProfiles(data);
      else if (error) toast("Failed to load profiles.", "error");
      setIsLoading(false);
    }
    load();
  }, []);

  // Compute fetch range
  const fetchRange = useMemo(() => {
    if (view === "week") {
      return { start: weekStart, end: addDays(weekStart, 7) };
    } else {
      const start = startOfWeek(monthStart); // include leading days
      const end = addDays(start, 42); // 6 weeks
      return { start, end };
    }
  }, [view, weekStart, monthStart]);

  // Fetch overlaps whenever range changes
  const fetchOverlaps = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch(
        `/api/overlap?start=${encodeURIComponent(fetchRange.start.toISOString())}&end=${encodeURIComponent(fetchRange.end.toISOString())}`
      );
      const data = await res.json();
      if (Array.isArray(data)) setOverlapSlots(data);
      else toast("Invalid response from schedule endpoint.", "error");
    } catch {
      toast("Error fetching group overlaps.", "error");
    } finally {
      setIsFetching(false);
    }
  }, [fetchRange]);

  useEffect(() => { fetchOverlaps(); }, [fetchOverlaps]);

  // Build a lookup map: "YYYY-MM-DD|H" → OverlapSlot
  const slotMap = useMemo(() => {
    const map = new Map<string, OverlapSlot>();
    overlapSlots.forEach(slot => {
      const d = new Date(slot.slotStart);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}|${d.getHours()}`;
      map.set(key, slot);
    });
    return map;
  }, [overlapSlots]);

  // Get slot for a given day + hour
  function getSlot(day: Date, hour: number): OverlapSlot | undefined {
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}|${hour}`;
    return slotMap.get(key);
  }

  // Cell click handler
  function handleCellClick(e: React.MouseEvent<HTMLButtonElement>, slot: OverlapSlot) {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({ slot, anchorRect: rect });
  }

  // Computed free/busy for popover
  const { freeParticipants, busyParticipants } = useMemo(() => {
    if (!popover || profiles.length === 0) return { freeParticipants: [], busyParticipants: [] };
    const freeIds = new Set(popover.slot.freeUserIds);
    const free: Profile[] = [];
    const busy: Profile[] = [];
    profiles.forEach(p => (freeIds.has(p.id) ? free : busy).push(p));
    return { freeParticipants: free, busyParticipants: busy };
  }, [popover, profiles]);

  // Top 5 best upcoming slots
  const topSlots = useMemo(() => {
    const now = new Date();
    return [...overlapSlots]
      .filter(s => new Date(s.slotStart) >= now)
      .sort((a, b) => b.freeCount - a.freeCount || new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime())
      .slice(0, 5);
  }, [overlapSlots]);

  if (isLoading) return <CalendarSkeleton />;

  // ── Week grid days ──
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  // ── Month grid ──
  const monthGridStart = startOfWeek(monthStart);
  const monthDays = Array.from({ length: 42 }, (_, i) => addDays(monthGridStart, i));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

      {/* ── Main Grid ───────────────────────────────────────────────── */}
      <div className="lg:col-span-3 space-y-4">

        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Nav */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (view === "week") setWeekStart(w => addWeeks(w, -1));
                else setMonthStart(m => addMonths(m, -1));
              }}
              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center text-sm"
            >‹</button>
            <button
              onClick={() => {
                if (view === "week") setWeekStart(startOfWeek(new Date()));
                else setMonthStart(startOfMonth(new Date()));
              }}
              className="px-3 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-medium transition-all"
            >Today</button>
            <button
              onClick={() => {
                if (view === "week") setWeekStart(w => addWeeks(w, 1));
                else setMonthStart(m => addMonths(m, 1));
              }}
              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center text-sm"
            >›</button>
          </div>

          {/* Title */}
          <h2 className="text-sm font-semibold text-slate-200">
            {view === "week"
              ? `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTHS[addDays(weekStart, 6).getMonth()]} ${addDays(weekStart, 6).getDate()}, ${weekStart.getFullYear()}`
              : `${MONTHS[monthStart.getMonth()]} ${monthStart.getFullYear()}`
            }
          </h2>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            {(["week", "month"] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  view === v
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >{v.charAt(0).toUpperCase() + v.slice(1)}</button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
          <span className="font-medium text-slate-400">Availability:</span>
          {[
            { label: "None", bg: "rgba(30,30,45,0.8)", border: "rgba(71,85,105,0.3)" },
            { label: "Low", bg: "rgba(239,68,68,0.3)", border: "rgba(239,68,68,0.5)" },
            { label: "Fair", bg: "rgba(249,115,22,0.35)", border: "rgba(249,115,22,0.5)" },
            { label: "Good", bg: "rgba(234,179,8,0.35)", border: "rgba(234,179,8,0.5)" },
            { label: "Great", bg: "rgba(34,197,94,0.4)", border: "rgba(34,197,94,0.6)" },
          ].map(item => (
            <span key={item.label} className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm border" style={{ background: item.bg, borderColor: item.border }} />
              {item.label}
            </span>
          ))}
          {isFetching && (
            <span className="ml-auto flex items-center gap-1.5 text-indigo-400 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              Loading…
            </span>
          )}
        </div>

        {/* ── WEEK VIEW ── */}
        {view === "week" && (
          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/50">
            {/* Day headers */}
            <div className="grid border-b border-slate-800" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
              <div className="py-2 px-2" />
              {weekDays.map((day, i) => {
                const isToday = isSameDay(day, today);
                return (
                  <div key={i} className={`py-2 text-center border-l border-slate-800 ${isToday ? "bg-indigo-950/30" : ""}`}>
                    <div className="text-[10px] text-slate-500 font-medium">{DAYS_SHORT[day.getDay()]}</div>
                    <div className={`text-sm font-bold mt-0.5 w-7 h-7 rounded-full flex items-center justify-center mx-auto ${
                      isToday ? "bg-indigo-500 text-white" : "text-slate-300"
                    }`}>
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hour rows */}
            <div className="overflow-y-auto" style={{ maxHeight: "560px" }}>
              {HOURS.map(hour => (
                <div key={hour} className="grid border-b border-slate-800/60 last:border-b-0" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
                  {/* Hour label */}
                  <div className="py-1.5 pr-2 text-right text-[10px] text-slate-600 font-medium leading-none pt-2">
                    {formatHour(hour)}
                  </div>
                  {/* Day cells */}
                  {weekDays.map((day, di) => {
                    const slot = getSlot(day, hour);
                    const freeCount = slot?.freeCount ?? 0;
                    const colors = heatColor(freeCount, total);
                    const isToday = isSameDay(day, today);
                    return (
                      <button
                        key={di}
                        onClick={slot ? e => handleCellClick(e, slot) : undefined}
                        disabled={!slot}
                        className={`h-10 border-l border-slate-800/60 transition-all duration-150 relative group ${
                          slot ? "cursor-pointer hover:brightness-125 hover:scale-[0.97] active:scale-95" : "cursor-default"
                        } ${isToday ? "bg-indigo-950/10" : ""}`}
                        style={{
                          backgroundColor: colors.bg,
                          borderLeftColor: "rgba(51,65,85,0.4)",
                        }}
                        title={slot ? `${freeCount}/${total} free` : "No data"}
                      >
                        {/* Count badge */}
                        {slot && freeCount > 0 && (
                          <span
                            className="absolute inset-0 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: colors.text }}
                          >
                            {freeCount}/{total}
                          </span>
                        )}
                        {/* Subtle border overlay on hover */}
                        {slot && (
                          <span
                            className="absolute inset-0 rounded-[2px] border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                            style={{ borderColor: colors.border }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MONTH VIEW ── */}
        {view === "month" && (
          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/50">
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 border-b border-slate-800">
              {DAYS_SHORT.map(d => (
                <div key={d} className="py-2 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wide border-l border-slate-800 first:border-l-0">
                  {d}
                </div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {monthDays.map((day, i) => {
                const inMonth = day.getMonth() === monthStart.getMonth();
                const isToday = isSameDay(day, today);
                const ratio = inMonth ? bestRatioForDay(overlapSlots, day, total) : 0;
                const colors = inMonth ? heatColor(Math.round(ratio * total), total) : { bg: "transparent", border: "transparent", text: "rgb(51,65,85)", label: "" };
                const daySlots = overlapSlots.filter(s => isSameDay(new Date(s.slotStart), day));
                const bestSlot = daySlots.sort((a, b) => b.freeCount - a.freeCount)[0];

                return (
                  <button
                    key={i}
                    onClick={bestSlot ? e => handleCellClick(e, bestSlot) : undefined}
                    disabled={!bestSlot || !inMonth}
                    className={`min-h-[72px] p-2 border-l border-t border-slate-800 first:border-l-0 flex flex-col gap-1 transition-all group ${
                      inMonth && bestSlot ? "cursor-pointer hover:brightness-110" : "cursor-default"
                    } ${isToday ? "ring-1 ring-inset ring-indigo-500/60" : ""}`}
                    style={{ backgroundColor: inMonth ? colors.bg : "transparent" }}
                  >
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? "bg-indigo-500 text-white" : inMonth ? "text-slate-300" : "text-slate-700"
                    }`}>
                      {day.getDate()}
                    </span>
                    {inMonth && bestSlot && bestSlot.freeCount > 0 && (
                      <span className="text-[10px] font-bold opacity-70 group-hover:opacity-100" style={{ color: colors.text }}>
                        {bestSlot.freeCount}/{total} peak
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/20">
          <h2 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-2">
            <span>🔥</span> Best Slots
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">Top upcoming windows with highest availability. Click to inspect.</p>

          {topSlots.length === 0 ? (
            <p className="text-xs text-slate-600 italic">No upcoming slots found.</p>
          ) : (
            <div className="space-y-2">
              {topSlots.map((slot, idx) => {
                const d = new Date(slot.slotStart);
                const colors = heatColor(slot.freeCount, total);
                return (
                  <button
                    key={slot.slotStart}
                    onClick={e => handleCellClick(e, slot)}
                    className="w-full text-left p-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/60 transition-all group flex items-center gap-3"
                  >
                    <span className="w-5 h-5 rounded-md bg-slate-850 flex items-center justify-center text-[10px] font-bold text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-300 group-hover:text-slate-100 truncate">
                        {DAYS_SHORT[d.getDay()]}, {MONTHS[d.getMonth()]} {d.getDate()}
                      </div>
                      <div className="text-[10px] text-slate-500">{formatHour(d.getHours())} – {formatHour(d.getHours() + 1)}</div>
                    </div>
                    <span
                      className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg border shrink-0"
                      style={{ color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }}
                    >
                      {slot.freeCount}/{total}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/10 text-[11px] text-slate-500 leading-relaxed flex gap-2">
          <span className="mt-0.5">💡</span>
          <p>Click any colored cell to see exactly who's free and who's busy during that hour.</p>
        </div>
      </div>

      {/* ── Floating Popover ─────────────────────────────────────────── */}
      {popover && (
        <PopoverPanel
          ref={popoverRef}
          slot={popover.slot}
          anchorRect={popover.anchorRect}
          freeParticipants={freeParticipants}
          busyParticipants={busyParticipants}
          total={total}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  );
}

// ─── Popover Panel ────────────────────────────────────────────────────────────

import { forwardRef } from "react";

const PopoverPanel = forwardRef<
  HTMLDivElement,
  {
    slot: OverlapSlot;
    anchorRect: DOMRect;
    freeParticipants: Profile[];
    busyParticipants: Profile[];
    total: number;
    onClose: () => void;
  }
>(({ slot, anchorRect, freeParticipants, busyParticipants, total, onClose }, ref) => {
  const d = new Date(slot.slotStart);
  const colors = heatColor(slot.freeCount, total);
  const timeStr = `${formatHour(d.getHours())} – ${formatHour(d.getHours() + 1)}`;
  const dateStr = `${DAYS_SHORT[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;

  // Position popover: prefer below, fall back to above
  const viewportH = window.innerHeight;
  const spaceBelow = viewportH - anchorRect.bottom;
  const top = spaceBelow > 320 ? anchorRect.bottom + 8 : anchorRect.top - 8;
  const transform = spaceBelow > 320 ? "translateY(0)" : "translateY(-100%)";
  const left = Math.min(anchorRect.left, window.innerWidth - 300);

  function Avatar({ p, dimmed }: { p: Profile; dimmed?: boolean }) {
    return (
      <div className={`flex items-center gap-2 py-1 ${dimmed ? "opacity-50" : ""}`}>
        {p.avatar_url ? (
          <img src={p.avatar_url} alt={p.name ?? "User"} className="w-6 h-6 rounded-full object-cover border border-slate-700" />
        ) : (
          <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-300">
            {(p.name ?? "U")[0].toUpperCase()}
          </span>
        )}
        <span className="text-xs text-slate-300 truncate">{p.name ?? "Unknown"}</span>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="fixed z-[9999] w-72 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/60 p-4 animate-fade-in"
      style={{ top, left, transform }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs font-bold text-slate-200">{dateStr}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{timeStr}</div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-extrabold px-2 py-0.5 rounded-lg border"
            style={{ color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }}
          >
            {slot.freeCount}/{total} free
          </span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors text-lg leading-none">×</button>
        </div>
      </div>

      {/* Bar */}
      <div className="w-full h-1.5 rounded-full bg-slate-800 mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(slot.freeCount / total) * 100}%`, backgroundColor: colors.border }}
        />
      </div>

      {/* Lists */}
      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {freeParticipants.length > 0 && (
          <div>
            <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Free ({freeParticipants.length})
            </div>
            {freeParticipants.map(p => <Avatar key={p.id} p={p} />)}
          </div>
        )}
        {busyParticipants.length > 0 && (
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 pt-2 border-t border-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              Busy ({busyParticipants.length})
            </div>
            {busyParticipants.map(p => <Avatar key={p.id} p={p} dimmed />)}
          </div>
        )}
      </div>
    </div>
  );
});

PopoverPanel.displayName = "PopoverPanel";
