"use client";

import React, { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "@/lib/supabase/client";

// Fixed anchor week: June 14, 2026 (Sunday) to June 20, 2026 (Saturday)
const BASE_SUNDAY = "2026-06-14";

interface RecurringAvailability {
  id: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export default function RecurringCalendar() {
  const [userId, setUserId] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<any | null>(null);
  const calendarRef = useRef<any>(null);

  // Helper: DB row to FullCalendar event format
  const dbRowToEvent = (row: RecurringAvailability) => {
    const day = 14 + row.day_of_week;
    const dateStr = `2026-06-${day}`;
    return {
      id: row.id,
      title: "Available Free Slot",
      start: `${dateStr}T${row.start_time}`,
      end: `${dateStr}T${row.end_time}`,
      allDay: false,
      backgroundColor: "rgba(99, 102, 241, 0.25)", // Indigo tinted glass
      borderColor: "rgb(129, 140, 248)", // Indigo-400
      textColor: "rgb(224, 231, 255)", // Indigo-100
    };
  };

  // Helper: Event to DB row values
  const getDayOfWeekAndTimes = (start: Date, end: Date) => {
    const day_of_week = start.getDay();
    const pad = (n: number) => String(n).padStart(2, "0");
    const start_time = `${pad(start.getHours())}:${pad(start.getMinutes())}:00`;
    const end_time = `${pad(end.getHours())}:${pad(end.getMinutes())}:00`;
    return { day_of_week, start_time, end_time };
  };

  useEffect(() => {
    async function loadSessionAndData() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data, error } = await supabase
          .from("recurring_availability")
          .select("*")
          .eq("user_id", user.id);
        if (!error && data) {
          setEvents(data.map(dbRowToEvent));
        } else if (error) {
          console.error("Error fetching recurring pattern:", error);
        }
      }
      setIsLoading(false);
    }
    loadSessionAndData();
  }, []);

  const handleSelect = async (selectInfo: any) => {
    if (!userId) return;
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();

    const { day_of_week, start_time, end_time } = getDayOfWeekAndTimes(
      selectInfo.start,
      selectInfo.end
    );

    setIsSaving(true);
    const { data, error } = await supabase
      .from("recurring_availability")
      .insert({
        user_id: userId,
        day_of_week,
        start_time,
        end_time,
      })
      .select();

    setIsSaving(false);

    if (error) {
      console.error("Error creating availability:", error);
      alert("Failed to save selection. Please try again.");
      return;
    }

    if (data && data.length > 0) {
      const newEvent = dbRowToEvent(data[0]);
      setEvents((prev) => [...prev, newEvent]);
    }
  };

  const handleEventChange = async (changeInfo: any) => {
    const { event } = changeInfo;
    const { day_of_week, start_time, end_time } = getDayOfWeekAndTimes(
      event.start,
      event.end
    );

    setIsSaving(true);
    const { error } = await supabase
      .from("recurring_availability")
      .update({
        day_of_week,
        start_time,
        end_time,
      })
      .eq("id", event.id);

    setIsSaving(false);

    if (error) {
      console.error("Error updating availability slot:", error);
      alert("Failed to save changes. Reverting change.");
      changeInfo.revert();
    } else {
      setEvents((prev) =>
        prev.map((evt) =>
          evt.id === event.id
            ? { ...evt, start: event.startStr, end: event.endStr }
            : evt
        )
      );
    }
  };

  const handleEventClick = (clickInfo: any) => {
    setEventToDelete(clickInfo.event);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;
    setIsConfirmOpen(false);
    setIsSaving(true);
    const { error } = await supabase
      .from("recurring_availability")
      .delete()
      .eq("id", eventToDelete.id);

    setIsSaving(false);

    if (error) {
      console.error("Error deleting slot:", error);
      alert("Failed to delete slot. Please try again.");
    } else {
      eventToDelete.remove();
      setEvents((prev) => prev.filter((evt) => evt.id !== eventToDelete.id));
    }
    setEventToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] border border-slate-900 rounded-2xl bg-slate-900/10 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-sm text-slate-400">Loading availability calendar...</p>
      </div>
    );
  }

  return (
    <div className="relative border border-slate-900 rounded-2xl p-4 bg-slate-900/10 backdrop-blur-sm shadow-2xl">
      {isSaving && (
        <div className="absolute top-4 right-4 flex items-center space-x-2 bg-slate-900/80 border border-indigo-500/20 text-indigo-400 text-xs px-3 py-1.5 rounded-full z-10 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
          <span>Auto-saving...</span>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Delete availability slot?</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to remove this recurring availability block? This will update your default pattern.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                id="cancel-delete-btn"
                onClick={() => {
                  setIsConfirmOpen(false);
                  setEventToDelete(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-btn"
                onClick={confirmDelete}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/10 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        initialDate={BASE_SUNDAY}
        headerToolbar={false}
        dayHeaderFormat={{ weekday: "long" }}
        slotMinTime="06:00:00"
        slotMaxTime="24:00:00"
        allDaySlot={false}
        editable={true}
        selectable={true}
        selectMirror={true}
        events={events}
        select={handleSelect}
        eventDrop={handleEventChange}
        eventResize={handleEventChange}
        eventClick={handleEventClick}
        height="auto"
        timeZone="local"
      />
    </div>
  );
}

