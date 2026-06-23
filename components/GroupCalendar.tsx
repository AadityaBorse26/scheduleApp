/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "@/lib/supabase/client";

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

export default function GroupCalendar() {
  const calendarRef = useRef<any>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [overlapSlots, setOverlapSlots] = useState<OverlapSlot[]>([]);
  
  // View states
  const [visibleStart, setVisibleStart] = useState<Date | null>(null);
  const [visibleEnd, setVisibleEnd] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  
  // Selected slot detail modal
  const [selectedSlot, setSelectedSlot] = useState<OverlapSlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Fetch all profiles once on mount
  useEffect(() => {
    async function loadProfiles() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, avatar_url");
        if (!error && data) {
          setProfiles(data);
        } else if (error) {
          console.error("Error loading profiles:", error);
        }
      } catch (err) {
        console.error("Unexpected profiles error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfiles();
  }, []);

  useEffect(() => {
    if (!visibleStart || !visibleEnd) return;
    const start = visibleStart;
    const end = visibleEnd;
    
    async function fetchOverlaps() {
      setIsFetching(true);
      try {
        const startStr = start.toISOString();
        const endStr = end.toISOString();
        const res = await fetch(
          `/api/overlap?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`
        );
        const data = await res.json();
        
        if (Array.isArray(data)) {
          setOverlapSlots(data);
        } else {
          console.error("Overlap API returned non-array:", data);
        }
      } catch (err) {
        console.error("Overlap fetch error:", err);
      } finally {
        setIsFetching(false);
      }
    }
    fetchOverlaps();
  }, [visibleStart, visibleEnd]);

  // Set visible range on datesSet trigger
  const handleDatesSet = (arg: any) => {
    setVisibleStart(arg.start);
    setVisibleEnd(arg.end);
  };

  // 3. Map overlap slots into FullCalendar heatmap events
  const events = useMemo(() => {
    return overlapSlots.map(slot => {
      const freeCount = slot.freeCount;
      const ratio = freeCount / 12;

      let backgroundColor = "rgba(71, 85, 105, 0.12)"; // slate-600 low opacity (gray at 0)
      let borderColor = "rgba(100, 116, 139, 0.25)";
      let textColor = "rgb(148, 163, 184)";

      if (freeCount > 0) {
        // Deepening green as freeCount rises, solid green at 12/12
        const bgAlpha = 0.08 + 0.92 * ratio;
        const borderAlpha = 0.2 + 0.8 * ratio;
        backgroundColor = `rgba(16, 185, 129, ${bgAlpha})`; // emerald-500
        borderColor = `rgba(52, 211, 153, ${borderAlpha})`;   // emerald-400
        textColor = `rgb(209, 250, 229)`;                  // emerald-100
      }

      return {
        id: `slot-${slot.slotStart}`,
        title: `${freeCount}/12 Free`,
        start: slot.slotStart,
        end: slot.slotEnd,
        backgroundColor,
        borderColor,
        textColor,
        extendedProps: {
          slotStart: slot.slotStart,
          slotEnd: slot.slotEnd,
          freeCount,
          freeUserIds: slot.freeUserIds
        }
      };
    });
  }, [overlapSlots]);

  // 4. Compute Top 5 upcoming windows with highest freeCount (soonest first)
  const topUpcoming = useMemo(() => {
    const now = new Date();
    // Keep only slots starting in the future
    const futureSlots = overlapSlots.filter(
      slot => new Date(slot.slotStart) >= now
    );
    
    // Sort descending by freeCount, then ascending by start date (soonest-first)
    return [...futureSlots]
      .sort((a, b) => {
        if (b.freeCount !== a.freeCount) {
          return b.freeCount - a.freeCount;
        }
        return new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime();
      })
      .slice(0, 5);
  }, [overlapSlots]);

  // Triggered on calendar event click
  const handleEventClick = (clickInfo: any) => {
    const props = clickInfo.event.extendedProps;
    setSelectedSlot({
      slotStart: props.slotStart,
      slotEnd: props.slotEnd,
      freeCount: props.freeCount,
      freeUserIds: props.freeUserIds
    });
    setIsModalOpen(true);
  };

  // Jump calendar view to selected slot start and highlight
  const handleJumpToSlot = (startStr: string) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const date = new Date(startStr);
      calendarApi.gotoDate(date);
      // Switch to timeGridDay or timeGridWeek to display time details clearly
      if (calendarApi.view.type === "dayGridMonth") {
        calendarApi.changeView("timeGridWeek");
      }
    }
  };

  // Formatter for readable slot intervals
  const formatSlotTime = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    const dateOptions: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
    const timeOptions: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
    
    return {
      date: start.toLocaleDateString("en-US", dateOptions),
      time: `${start.toLocaleTimeString("en-US", timeOptions)} - ${end.toLocaleTimeString("en-US", timeOptions)}`
    };
  };

  // Group participants into Free and Busy lists for the modal detail view
  const { freeParticipants, busyParticipants } = useMemo(() => {
    if (!selectedSlot || profiles.length === 0) {
      return { freeParticipants: [], busyParticipants: [] };
    }
    
    const free: Profile[] = [];
    const busy: Profile[] = [];
    
    profiles.forEach(profile => {
      const isFree = selectedSlot.freeUserIds.includes(profile.id);
      if (isFree) {
        free.push(profile);
      } else {
        busy.push(profile);
      }
    });
    
    return { freeParticipants: free, busyParticipants: busy };
  }, [selectedSlot, profiles]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] border border-slate-900 rounded-3xl bg-slate-900/10 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-sm text-slate-400 font-semibold">Loading group coordination workspace...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* 1. Left Heatmap Calendar View */}
      <div className="lg:col-span-3 relative border border-slate-900 rounded-3xl p-6 bg-slate-900/10 backdrop-blur-sm shadow-2xl">
        {isFetching && (
          <div className="absolute top-4 right-4 flex items-center space-x-2 bg-slate-950/80 border border-indigo-500/20 text-indigo-400 text-xs px-3 py-1.5 rounded-full z-[100] animate-pulse shadow-md">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
            <span>Fetching overlap data...</span>
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between text-xs text-slate-400 border-b border-slate-900 pb-4">
          <span className="font-semibold text-slate-350">💡 Heatmap Legend (out of 12 profiles):</span>
          <div className="flex flex-wrap gap-2.5 items-center">
            <span className="flex items-center">
              <span className="w-4 h-4 rounded bg-slate-800/40 border border-slate-800 mr-1.5"></span>
              0/12 Free
            </span>
            <span className="w-3 h-0.5 bg-slate-850"></span>
            <span className="flex items-center">
              <span className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/25 mr-1.5"></span>
              Low Overlap
            </span>
            <span className="w-3 h-0.5 bg-slate-850"></span>
            <span className="flex items-center">
              <span className="w-4 h-4 rounded bg-emerald-500/50 border border-emerald-500/60 mr-1.5"></span>
              Moderate Overlap
            </span>
            <span className="w-3 h-0.5 bg-slate-850"></span>
            <span className="flex items-center">
              <span className="w-4 h-4 rounded bg-emerald-500/90 border border-emerald-400 mr-1.5"></span>
              12/12 Free
            </span>
          </div>
        </div>

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={false}
          editable={false}
          selectable={false}
          events={events}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          height="auto"
          timeZone="local"
        />
      </div>

      {/* 2. Right Top-5 Sidebar Panel */}
      <div className="lg:col-span-1 space-y-6 flex flex-col justify-start">
        <div className="p-6 rounded-3xl border border-slate-900 bg-slate-900/10 backdrop-blur-sm shadow-xl">
          <h2 className="text-lg font-bold text-slate-100 mb-1 flex items-center space-x-2">
            <span>🔥</span>
            <span>Best Meeting Slots</span>
          </h2>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-5">
            Top 5 upcoming 15-minute windows with the highest friend availability. Click a card to highlight it on the calendar.
          </p>

          {topUpcoming.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-850 rounded-2xl leading-relaxed">
              No upcoming windows fetched. Ensure you are looking at current or future dates.
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              {topUpcoming.map((slot, index) => {
                const { date, time } = formatSlotTime(slot.slotStart, slot.slotEnd);
                
                return (
                  <button
                    key={`sidebar-slot-${slot.slotStart}`}
                    onClick={() => handleJumpToSlot(slot.slotStart)}
                    className="w-full text-left p-3.5 rounded-2xl border border-slate-850 bg-slate-900/20 hover:bg-slate-850 hover:border-slate-700 transition-all duration-200 group hover:-translate-y-0.5 active:scale-98 flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-5 h-5 rounded-lg bg-slate-850 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:text-indigo-400 transition-colors">
                          {index + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-300 group-hover:text-slate-100 transition-colors">
                          {date}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium pl-6">{time}</p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-extrabold border ${
                          slot.freeCount >= 10
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : slot.freeCount >= 6
                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {slot.freeCount}/12 Free
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Small calendar hint card */}
        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/5 text-slate-500 text-[11px] leading-relaxed flex items-start space-x-2">
          <span>💡</span>
          <p>
            The group coordinator overlays all calendars automatically. Add your Google Calendar or specify date overrides to update your schedule inside this group workspace.
          </p>
        </div>
      </div>

      {/* 3. Slot Detail Popover Modal */}
      {isModalOpen && selectedSlot && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center animate-fade-in">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-850 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">Slot Availability details</h3>
                <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-1">
                  <span>📅</span>
                  <span>{formatSlotTime(selectedSlot.slotStart, selectedSlot.slotEnd).date}</span>
                  <span className="text-slate-600">•</span>
                  <span>{formatSlotTime(selectedSlot.slotStart, selectedSlot.slotEnd).time}</span>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {selectedSlot.freeCount}/12 Free
              </span>
            </div>

            {/* Content Lists */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1.5">
              
              {/* Free Friends */}
              <div>
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Free Friends ({freeParticipants.length})</span>
                </h4>
                {freeParticipants.length === 0 ? (
                  <p className="text-xs text-slate-500 italic pl-3">Nobody is free during this slot.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {freeParticipants.map(participant => (
                      <div
                        key={`free-${participant.id}`}
                        className="flex items-center space-x-2.5 p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10"
                      >
                        {participant.avatar_url ? (
                          <img
                            src={participant.avatar_url}
                            alt={participant.name || "User"}
                            className="w-7 h-7 rounded-full border border-emerald-500/30 object-cover"
                          />
                        ) : (
                          <span className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                            {(participant.name || "U")[0].toUpperCase()}
                          </span>
                        )}
                        <span className="text-xs font-medium text-slate-200 truncate">
                          {participant.name || "Unknown Friend"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Busy Friends */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5 border-t border-slate-850 pt-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  <span>Busy/Unavailable ({busyParticipants.length})</span>
                </h4>
                {busyParticipants.length === 0 ? (
                  <p className="text-xs text-slate-500 italic pl-3">Everyone is free during this slot!</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {busyParticipants.map(participant => (
                      <div
                        key={`busy-${participant.id}`}
                        className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-800/10 border border-slate-800/50"
                      >
                        {participant.avatar_url ? (
                          <img
                            src={participant.avatar_url}
                            alt={participant.name || "User"}
                            className="w-7 h-7 rounded-full border border-slate-700 object-cover opacity-60"
                          />
                        ) : (
                          <span className="w-7 h-7 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {(participant.name || "U")[0].toUpperCase()}
                          </span>
                        )}
                        <span className="text-xs font-medium text-slate-450 truncate">
                          {participant.name || "Unknown Friend"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-850 mt-5 flex justify-end">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedSlot(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 transition-colors"
              >
                Close details
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
