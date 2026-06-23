/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/components/Toast";
import CalendarSkeleton from "@/components/CalendarSkeleton";

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

export default function AvailabilityCalendar() {
  const calendarRef = useRef<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Data State
  const [patterns, setPatterns] = useState<RecurringAvailability[]>([]);
  const [busyBlocks, setBusyBlocks] = useState<SyncedBusyBlock[]>([]);
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [visibleStart, setVisibleStart] = useState<Date | null>(null);
  const [visibleEnd, setVisibleEnd] = useState<Date | null>(null);
  
  // Override Creation Modals
  const [selectedRange, setSelectedRange] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Override Edit Modals
  const [activeOverride, setActiveOverride] = useState<{ id: string; status: "free" | "unavailable" } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch initial parameters
  useEffect(() => {
    async function loadCalendarData() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Fetch default pattern
        const { data: patternData } = await supabase
          .from("recurring_availability")
          .select("*")
          .eq("user_id", user.id);
        if (patternData) setPatterns(patternData);

        // Fetch google busy blocks
        const { data: busyData } = await supabase
          .from("synced_busy_blocks")
          .select("*")
          .eq("user_id", user.id)
          .eq("source", "google");
        if (busyData) setBusyBlocks(busyData);

        // Fetch overrides
        const { data: overrideData } = await supabase
          .from("date_overrides")
          .select("*")
          .eq("user_id", user.id);
        if (overrideData) setOverrides(overrideData);
      }
      setIsLoading(false);
    }
    loadCalendarData();
  }, []);

  // Update visible range dynamically
  const handleDatesSet = (arg: any) => {
    setVisibleStart(arg.start);
    setVisibleEnd(arg.end);
  };

  // Compile three event layers
  const events = useMemo(() => {
    const list: any[] = [];

    // Layer 1: Synced Google Busy Blocks (Red, Read-Only, Non-Draggable)
    for (const block of busyBlocks) {
      list.push({
        id: `google-${block.id}`,
        title: "Busy (Google Calendar)",
        start: block.start_datetime,
        end: block.end_datetime,
        backgroundColor: "rgba(239, 68, 68, 0.15)",
        borderColor: "rgb(248, 113, 113)",
        textColor: "rgb(254, 226, 226)",
        editable: false,
        extendedProps: { type: "google" }
      });
    }

    // Layer 2: Projected Recurring Weekly Pattern (Light-Green, Read-Only)
    if (visibleStart && visibleEnd && patterns.length > 0) {
      const start = new Date(visibleStart);
      const end = new Date(visibleEnd);
      const curr = new Date(start);

      while (curr <= end) {
        const dayOfWeek = curr.getDay();
        const dayPatterns = patterns.filter(p => p.day_of_week === dayOfWeek);

        for (const pattern of dayPatterns) {
          const year = curr.getFullYear();
          const month = String(curr.getMonth() + 1).padStart(2, "0");
          const day = String(curr.getDate()).padStart(2, "0");
          const dateStr = `${year}-${month}-${day}`;

          list.push({
            id: `pattern-${pattern.id}-${dateStr}`,
            title: "Available (Weekly Pattern)",
            start: `${dateStr}T${pattern.start_time}`,
            end: `${dateStr}T${pattern.end_time}`,
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            borderColor: "rgb(52, 211, 153)",
            textColor: "rgb(209, 250, 229)",
            editable: false,
            extendedProps: { type: "pattern" }
          });
        }
        curr.setDate(curr.getDate() + 1);
      }
    }

    // Layer 3: Date Overrides (Blue for Free, Gray for Unavailable, Drag-Editable)
    for (const override of overrides) {
      const isFree = override.status === "free";
      list.push({
        id: `override-${override.id}`,
        title: isFree ? "Override: Available" : "Override: Unavailable",
        start: `${override.date}T${override.start_time}`,
        end: `${override.date}T${override.end_time}`,
        backgroundColor: isFree ? "rgba(59, 130, 246, 0.22)" : "rgba(100, 116, 139, 0.22)",
        borderColor: isFree ? "rgb(96, 165, 250)" : "rgb(148, 163, 184)",
        textColor: isFree ? "rgb(219, 234, 254)" : "rgb(241, 245, 249)",
        editable: true,
        extendedProps: {
          type: "override",
          dbId: override.id,
          status: override.status
        }
      });
    }

    return list;
  }, [busyBlocks, overrides, patterns, visibleStart, visibleEnd]);

  // Restrict drag selections so users cannot overlay on top of Google Sync blocks
  const handleSelectAllow = (selectInfo: any) => {
    const selStart = new Date(selectInfo.start);
    const selEnd = new Date(selectInfo.end);

    const overlapsGoogle = busyBlocks.some((block) => {
      const blockStart = new Date(block.start_datetime);
      const blockEnd = new Date(block.end_datetime);
      return selStart < blockEnd && selEnd > blockStart;
    });

    return !overlapsGoogle;
  };

  // Drag selection trigger
  const handleSelect = (selectInfo: any) => {
    setSelectedRange(selectInfo);
    setIsCreateModalOpen(true);
  };

  // Submit new override block
  const handleCreateOverride = async (status: "free" | "unavailable") => {
    if (!selectedRange || !userId) return;
    setIsCreateModalOpen(false);

    const start = selectedRange.start;
    const end = selectedRange.end;
    const calendarApi = selectedRange.view.calendar;
    calendarApi.unselect();

    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    const startTimeStr = `${pad(start.getHours())}:${pad(start.getMinutes())}:00`;
    const endTimeStr = `${pad(end.getHours())}:${pad(end.getMinutes())}:00`;

    setIsSaving(true);
    const { data, error } = await supabase
      .from("date_overrides")
      .insert({
        user_id: userId,
        date: dateStr,
        start_time: startTimeStr,
        end_time: endTimeStr,
        status: status
      })
      .select()
      .single();

    setIsSaving(false);

    if (error) {
      console.error("Error inserting date override:", error);
      toast("Failed to save schedule override. Please try again.", "error");
    } else if (data) {
      setOverrides(prev => [...prev, data]);
      toast("Date override created successfully!", "success");
    }
    setSelectedRange(null);
  };

  // Resizing or repositioning an override event
  const handleEventChange = async (changeInfo: any) => {
    const { event } = changeInfo;
    const type = event.extendedProps.type;

    if (type !== "override") {
      changeInfo.revert();
      return;
    }

    const dbId = event.extendedProps.dbId;
    const start = event.start;
    const end = event.end;

    if (!start || !end) return;

    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    const startTimeStr = `${pad(start.getHours())}:${pad(start.getMinutes())}:00`;
    const endTimeStr = `${pad(end.getHours())}:${pad(end.getMinutes())}:00`;

    setIsSaving(true);
    const { error } = await supabase
      .from("date_overrides")
      .update({
        date: dateStr,
        start_time: startTimeStr,
        end_time: endTimeStr
      })
      .eq("id", dbId);

    setIsSaving(false);

    if (error) {
      console.error("Error updating override position:", error);
      toast("Failed to update override position. Reverting changes.", "error");
      changeInfo.revert();
    } else {
      setOverrides(prev =>
        prev.map(row =>
          row.id === dbId
            ? { ...row, date: dateStr, start_time: startTimeStr, end_time: endTimeStr }
            : row
        )
      );
      toast("Override block repositioned successfully!", "success");
    }
  };

  // Click on override triggers Edit modal
  const handleEventClick = (clickInfo: any) => {
    const { event } = clickInfo;
    const type = event.extendedProps.type;
    
    if (type !== "override") return;

    setActiveOverride({
      id: event.extendedProps.dbId,
      status: event.extendedProps.status
    });
    setIsEditModalOpen(true);
  };

  // Toggle free vs unavailable
  const handleToggleStatus = async () => {
    if (!activeOverride) return;
    setIsEditModalOpen(false);
    
    const newStatus = activeOverride.status === "free" ? "unavailable" : "free";

    setIsSaving(true);
    const { error } = await supabase
      .from("date_overrides")
      .update({ status: newStatus })
      .eq("id", activeOverride.id);
    
    setIsSaving(false);

    if (error) {
      console.error("Error toggling override status:", error);
      toast("Failed to toggle override status. Please try again.", "error");
    } else {
      setOverrides(prev =>
        prev.map(row =>
          row.id === activeOverride.id ? { ...row, status: newStatus } : row
        )
      );
      toast(`Override changed to ${newStatus === "free" ? "Available" : "Unavailable"}.`, "success");
    }
    setActiveOverride(null);
  };

  // Delete override
  const handleDeleteOverride = async () => {
    if (!activeOverride) return;
    setIsEditModalOpen(false);

    setIsSaving(true);
    const { error } = await supabase
      .from("date_overrides")
      .delete()
      .eq("id", activeOverride.id);
    
    setIsSaving(false);

    if (error) {
      console.error("Error deleting override:", error);
      toast("Failed to delete override. Please try again.", "error");
    } else {
      setOverrides(prev => prev.filter(row => row.id !== activeOverride.id));
      toast("Override block removed.", "success");
    }
    setActiveOverride(null);
  };

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Friendly empty weekly availability pattern state warnings */}
      {patterns.length === 0 && (
        <div className="p-5 rounded-3xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs leading-relaxed flex items-start space-x-3 animate-fade-in shadow-lg">
          <span className="text-base mt-0.5">⚠️</span>
          <div className="space-y-1">
            <p className="font-bold">Weekly availability pattern not set up yet</p>
            <p className="text-slate-400">
              You haven&apos;t added default available slots. Without a recurring pattern, you will be shown as unavailable by default. 
              Click <a href="/availability/recurring" className="text-indigo-400 hover:text-indigo-350 font-semibold underline">Edit Weekly Pattern</a> to configure your free hours.
            </p>
          </div>
        </div>
      )}

      <div className="relative border border-slate-900 rounded-3xl p-6 bg-slate-900/10 backdrop-blur-sm shadow-2xl">
        {isSaving && (
          <div className="absolute top-4 right-4 flex items-center space-x-2 bg-slate-950/80 border border-indigo-500/20 text-indigo-400 text-xs px-3 py-1.5 rounded-full z-[100] animate-pulse">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
            <span>Saving...</span>
          </div>
        )}

        {/* Popover / Modal to Mark Selection */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-100 mb-2">Create Date Override</h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Mark this selected time range as available or unavailable for bookings. This will overlay on top of your default pattern and synced Google Calendar events.
              </p>
              <div className="flex flex-col space-y-2.5">
                <button
                  onClick={() => handleCreateOverride("free")}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  Available (Free - Blue)
                </button>
                <button
                  onClick={() => handleCreateOverride("unavailable")}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-700 hover:bg-slate-650 text-slate-200 transition-colors"
                >
                  Unavailable (Busy - Gray)
                </button>
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setSelectedRange(null);
                    if (calendarRef.current) {
                      calendarRef.current.getApi().unselect();
                    }
                  }}
                  className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-800/50 hover:bg-slate-800 text-slate-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Popover / Modal to Edit Override */}
        {isEditModalOpen && activeOverride && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-100 mb-2">Edit Override Block</h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Currently marked as <span className="font-semibold text-slate-200">{activeOverride.status === "free" ? "Available" : "Unavailable"}</span>. Choose an action below:
              </p>
              <div className="flex flex-col space-y-2.5">
                <button
                  onClick={handleToggleStatus}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  Switch to {activeOverride.status === "free" ? "Unavailable" : "Available"}
                </button>
                <button
                  onClick={handleDeleteOverride}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                >
                  Delete Override Block
                </button>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setActiveOverride(null);
                  }}
                  className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-800/50 hover:bg-slate-800 text-slate-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between text-xs text-slate-400 border-b border-slate-900 pb-4">
          <span className="font-semibold text-slate-300">💡 Legend:</span>
          <div className="flex flex-wrap gap-3.5">
            <span className="flex items-center">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500 mr-1.5"></span>
              Weekly Pattern
            </span>
            <span className="flex items-center">
              <span className="w-3.5 h-3.5 rounded bg-red-500/20 border border-red-500 mr-1.5"></span>
              Google Calendar (Read-only)
            </span>
            <span className="flex items-center">
              <span className="w-3.5 h-3.5 rounded bg-blue-500/20 border border-blue-500 mr-1.5"></span>
              Override: Available
            </span>
            <span className="flex items-center">
              <span className="w-3.5 h-3.5 rounded bg-slate-500/20 border border-slate-500 mr-1.5"></span>
              Override: Unavailable
            </span>
          </div>
        </div>

        <FullCalendar
          key={isMobile ? "mobile" : "desktop"}
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={isMobile ? "timeGridDay" : "timeGridWeek"}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          slotMinTime="08:00:00"
          slotMaxTime="23:00:00"
          allDaySlot={false}
          editable={true}
          selectable={true}
          selectMirror={true}
          events={events}
          select={handleSelect}
          selectAllow={handleSelectAllow}
          eventDrop={handleEventChange}
          eventResize={handleEventChange}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          height="auto"
          timeZone="local"
        />
      </div>
    </div>
  );
}
