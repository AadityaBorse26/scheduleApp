/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/components/ui/Toast";
import CalendarSkeleton from "./CalendarSkeleton";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecurringAvailability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface SyncedBusyBlock {
  id: string;
  start_datetime: string;
  end_datetime: string;
  source: string;
}

interface DateOverride {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "free" | "unavailable";
}

// ─── Legend items ─────────────────────────────────────────────────────────────

const LEGEND = [
  { color: "bg-emerald-500/20 border-emerald-500", label: "Weekly Pattern" },
  { color: "bg-red-500/20 border-red-500",         label: "Google Calendar" },
  { color: "bg-blue-500/20 border-blue-500",       label: "Override: Free" },
  { color: "bg-slate-500/20 border-slate-500",     label: "Override: Busy" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AvailabilityCalendar() {
  const calendarRef = useRef<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Data
  const [patterns, setPatterns] = useState<RecurringAvailability[]>([]);
  const [busyBlocks, setBusyBlocks] = useState<SyncedBusyBlock[]>([]);
  const [overrides, setOverrides] = useState<DateOverride[]>([]);

  // UI
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [visibleStart, setVisibleStart] = useState<Date | null>(null);
  const [visibleEnd, setVisibleEnd] = useState<Date | null>(null);
  const [currentView, setCurrentView] = useState<string>("timeGridWeek");
  const [titleText, setTitleText] = useState("");
  const [showLegend, setShowLegend] = useState(false);
  const [showFullDay, setShowFullDay] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Modals
  const [selectedRange, setSelectedRange] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeOverride, setActiveOverride] = useState<{ id: string; status: "free" | "unavailable" } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // ── Setup ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const [{ data: pat }, { data: busy }, { data: ov }] = await Promise.all([
          supabase.from("recurring_availability").select("*").eq("user_id", user.id),
          supabase.from("synced_busy_blocks").select("*").eq("user_id", user.id).eq("source", "google"),
          supabase.from("date_overrides").select("*").eq("user_id", user.id),
        ]);
        if (pat) setPatterns(pat);
        if (busy) setBusyBlocks(busy);
        if (ov) setOverrides(ov);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  // ── Calendar API helpers ───────────────────────────────────────────────────

  const getApi = useCallback(() => calendarRef.current?.getApi(), []);

  const syncTitle = useCallback(() => {
    const api = getApi();
    if (api) setTitleText(api.view.title);
  }, [getApi]);

  const navigate = (dir: "prev" | "next" | "today") => {
    const api = getApi();
    if (!api) return;
    if (dir === "prev") api.prev();
    else if (dir === "next") api.next();
    else api.today();
    syncTitle();
  };

  const changeView = (v: string) => {
    const api = getApi();
    if (!api) return;
    api.changeView(v);
    setCurrentView(v);
    syncTitle();
  };

  // ── Events ─────────────────────────────────────────────────────────────────

  const events = useMemo(() => {
    const list: any[] = [];

    // Google busy
    for (const b of busyBlocks) {
      list.push({
        id: `google-${b.id}`,
        title: "Busy",
        start: b.start_datetime,
        end: b.end_datetime,
        backgroundColor: "rgba(239,68,68,0.15)",
        borderColor: "rgb(248,113,113)",
        textColor: "rgb(254,226,226)",
        editable: false,
        extendedProps: { type: "google" },
      });
    }

    // Weekly pattern projection
    if (visibleStart && visibleEnd && patterns.length > 0) {
      const curr = new Date(visibleStart);
      while (curr <= new Date(visibleEnd)) {
        const dow = curr.getDay();
        const pad = (n: number) => String(n).padStart(2, "0");
        const dateStr = `${curr.getFullYear()}-${pad(curr.getMonth() + 1)}-${pad(curr.getDate())}`;
        for (const p of patterns.filter(p => p.day_of_week === dow)) {
          list.push({
            id: `pat-${p.id}-${dateStr}`,
            title: "Available",
            start: `${dateStr}T${p.start_time}`,
            end: `${dateStr}T${p.end_time}`,
            backgroundColor: "rgba(16,185,129,0.12)",
            borderColor: "rgb(52,211,153)",
            textColor: "rgb(209,250,229)",
            editable: false,
            extendedProps: { type: "pattern" },
          });
        }
        curr.setDate(curr.getDate() + 1);
      }
    }

    // Overrides
    for (const ov of overrides) {
      const free = ov.status === "free";
      list.push({
        id: `ov-${ov.id}`,
        title: free ? "Override: Free" : "Override: Busy",
        start: `${ov.date}T${ov.start_time}`,
        end: `${ov.date}T${ov.end_time}`,
        backgroundColor: free ? "rgba(59,130,246,0.22)" : "rgba(100,116,139,0.22)",
        borderColor: free ? "rgb(96,165,250)" : "rgb(148,163,184)",
        textColor: free ? "rgb(219,234,254)" : "rgb(241,245,249)",
        editable: true,
        extendedProps: { type: "override", dbId: ov.id, status: ov.status },
      });
    }

    return list;
  }, [busyBlocks, overrides, patterns, visibleStart, visibleEnd]);

  // ── Interaction handlers ───────────────────────────────────────────────────

  const handleSelectAllow = (info: any) => {
    const s = new Date(info.start), e = new Date(info.end);
    return !busyBlocks.some(b => s < new Date(b.end_datetime) && e > new Date(b.start_datetime));
  };

  const handleSelect = (info: any) => {
    setSelectedRange(info);
    setIsCreateModalOpen(true);
  };

  const handleCreateOverride = async (status: "free" | "unavailable") => {
    if (!selectedRange || !userId) return;
    setIsCreateModalOpen(false);
    const { start, end } = selectedRange;
    selectedRange.view.calendar.unselect();
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    const s = `${pad(start.getHours())}:${pad(start.getMinutes())}:00`;
    const e = `${pad(end.getHours())}:${pad(end.getMinutes())}:00`;
    setIsSaving(true);
    const { data, error } = await supabase.from("date_overrides")
      .insert({ user_id: userId, date: dateStr, start_time: s, end_time: e, status })
      .select().single();
    setIsSaving(false);
    if (error) toast("Failed to save override.", "error");
    else if (data) { setOverrides(p => [...p, data]); toast("Override created.", "success"); }
    setSelectedRange(null);
  };

  const handleEventChange = async (info: any) => {
    if (info.event.extendedProps.type !== "override") { info.revert(); return; }
    const { start, end } = info.event;
    if (!start || !end) return;
    const pad = (n: number) => String(n).padStart(2, "0");
    const dbId = info.event.extendedProps.dbId;
    const dateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    const s = `${pad(start.getHours())}:${pad(start.getMinutes())}:00`;
    const e = `${pad(end.getHours())}:${pad(end.getMinutes())}:00`;
    setIsSaving(true);
    const { error } = await supabase.from("date_overrides")
      .update({ date: dateStr, start_time: s, end_time: e }).eq("id", dbId);
    setIsSaving(false);
    if (error) { toast("Failed to update override.", "error"); info.revert(); }
    else {
      setOverrides(p => p.map(r => r.id === dbId ? { ...r, date: dateStr, start_time: s, end_time: e } : r));
      toast("Override updated.", "success");
    }
  };

  const handleEventClick = (info: any) => {
    if (info.event.extendedProps.type !== "override") return;
    setActiveOverride({ id: info.event.extendedProps.dbId, status: info.event.extendedProps.status });
    setIsEditModalOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!activeOverride) return;
    setIsEditModalOpen(false);
    const newStatus = activeOverride.status === "free" ? "unavailable" : "free";
    setIsSaving(true);
    const { error } = await supabase.from("date_overrides").update({ status: newStatus }).eq("id", activeOverride.id);
    setIsSaving(false);
    if (error) toast("Failed to update status.", "error");
    else {
      setOverrides(p => p.map(r => r.id === activeOverride.id ? { ...r, status: newStatus } : r));
      toast(`Switched to ${newStatus === "free" ? "Available" : "Unavailable"}.`, "success");
    }
    setActiveOverride(null);
  };

  const handleDeleteOverride = async () => {
    if (!activeOverride) return;
    setIsEditModalOpen(false);
    setIsSaving(true);
    const { error } = await supabase.from("date_overrides").delete().eq("id", activeOverride.id);
    setIsSaving(false);
    if (error) toast("Failed to delete override.", "error");
    else { setOverrides(p => p.filter(r => r.id !== activeOverride.id)); toast("Override removed.", "success"); }
    setActiveOverride(null);
  };

  const handleDatesSet = (arg: any) => {
    setVisibleStart(arg.start);
    setVisibleEnd(arg.end);
    setTitleText(arg.view.title);
    setCurrentView(arg.view.type);
  };

  // ── Views config ───────────────────────────────────────────────────────────

  const VIEWS = [
    { key: "dayGridMonth", label: "Month" },
    { key: "timeGridWeek", label: "Week" },
    { key: "timeGridDay",  label: "Day"   },
  ];

  if (isLoading) return <CalendarSkeleton />;

  return (
    <div className="flex flex-col h-full">

      {/* ── Sticky Toolbar ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-5 py-3 flex items-center gap-3 flex-wrap">

        {/* Title */}
        <span className="text-sm font-semibold text-slate-200 min-w-[160px]">{titleText}</span>

        {/* Nav */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => navigate("prev")} className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center text-base">‹</button>
          <button onClick={() => navigate("next")} className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center text-base">›</button>
          <button onClick={() => navigate("today")} className="h-9 px-4 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs font-medium">Today</button>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-800 mx-0.5" />

        {/* View toggle */}
        <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
          {VIEWS.map(v => (
            <button
              key={v.key}
              onClick={() => changeView(v.key)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                currentView === v.key
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >{v.label}</button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-800 mx-0.5" />

        {/* Show full day toggle */}
        <button
          onClick={() => setShowFullDay(f => !f)}
          className={`h-9 px-4 rounded-lg border text-xs font-medium transition-all ${
            showFullDay
              ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
              : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
          }`}
        >
          {showFullDay ? "Active hours" : "Full day"}
        </button>

        {/* Legend toggle */}
        <div className="relative">
          <button
            onClick={() => setShowLegend(l => !l)}
            className="h-9 px-4 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300 text-xs font-medium transition-all"
          >
            ℹ️ Legend
          </button>
          {showLegend && (
            <div className="absolute top-11 left-0 z-50 bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-2xl shadow-black/60 flex flex-col gap-2.5 min-w-[190px]">
              {LEGEND.map(l => (
                <span key={l.label} className="flex items-center gap-2.5 text-xs text-slate-400">
                  <span className={`w-3.5 h-3.5 rounded border shrink-0 ${l.color}`} />
                  {l.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <Link
          href="/availability/recurring"
          className="h-9 px-4 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-all hover:bg-slate-800 flex items-center"
        >
          🗓️ Weekly Pattern
        </Link>

        {/* Saving indicator */}
        {isSaving && (
          <span className="flex items-center gap-1.5 text-[11px] text-indigo-400 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
            Saving…
          </span>
        )}
      </div>

      {/* ── Inline warning — only when no pattern set ─────────────────── */}
      {patterns.length === 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/5 border-b border-amber-500/15 text-xs text-amber-300">
          <span>⚠️</span>
          <span>No weekly pattern set — you appear unavailable by default.</span>
          <Link href="/availability/recurring" className="ml-auto shrink-0 font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
            Set up now →
          </Link>
        </div>
      )}

      {/* ── Calendar ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden px-2 pb-2 pt-0">
        <style>{`
          /* Compact slot rows */
          .fc .fc-timegrid-slot { height: 1.6rem !important; }
          .fc .fc-timegrid-slot-label { font-size: 10px; color: rgb(100,116,139); }
          /* Hide FullCalendar's built-in toolbar (we use our own) */
          .fc .fc-header-toolbar { display: none !important; }
          /* Slim event text */
          .fc-event-title { font-size: 11px !important; font-weight: 600 !important; }
          /* Make the scroll container fill remaining height */
          .fc, .fc-view-harness { height: 100% !important; }
          .fc-scroller { overflow-y: auto !important; }
          /* Sticky day headers */
          .fc .fc-col-header { position: sticky; top: 0; z-index: 10; background: rgb(2,6,23); }
          .fc .fc-timegrid-axis { background: rgb(2,6,23); }
          /* Remove default border */
          .fc-theme-standard td, .fc-theme-standard th { border-color: rgba(51,65,85,0.5); }
          .fc-theme-standard .fc-scrollgrid { border: none; }
        `}</style>

        <FullCalendar
          key={`${isMobile ? "m" : "d"}-${showFullDay ? "full" : "active"}`}
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={isMobile ? "timeGridDay" : "timeGridWeek"}
          headerToolbar={false}
          slotMinTime={showFullDay ? "00:00:00" : "08:00:00"}
          slotMaxTime={showFullDay ? "24:00:00" : "23:00:00"}
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          allDaySlot={false}
          editable
          selectable
          selectMirror
          events={events}
          select={handleSelect}
          selectAllow={handleSelectAllow}
          eventDrop={handleEventChange}
          eventResize={handleEventChange}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          height="100%"
          timeZone="local"
          nowIndicator
        />
      </div>

      {/* ── Create Override Modal ─────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-xs w-full mx-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 mb-1">Create Override</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">Mark this time as available or blocked, overriding your weekly defaults.</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleCreateOverride("free")} className="py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors">✅ Available (Free)</button>
              <button onClick={() => handleCreateOverride("unavailable")} className="py-2.5 rounded-xl text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors">🚫 Unavailable (Busy)</button>
              <button onClick={() => { setIsCreateModalOpen(false); setSelectedRange(null); getApi()?.unselect(); }} className="py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Override Modal ───────────────────────────────────────── */}
      {isEditModalOpen && activeOverride && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-xs w-full mx-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 mb-1">Edit Override</h3>
            <p className="text-xs text-slate-500 mb-4">
              Currently <span className="font-semibold text-slate-300">{activeOverride.status === "free" ? "Available" : "Unavailable"}</span>.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={handleToggleStatus} className="py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
                Switch to {activeOverride.status === "free" ? "Unavailable" : "Available"}
              </button>
              <button onClick={handleDeleteOverride} className="py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors">Delete Override</button>
              <button onClick={() => { setIsEditModalOpen(false); setActiveOverride(null); }} className="py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
