import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import CalendarSkeleton from "@/components/CalendarSkeleton";

// Dynamic import to bypass FullCalendar SSR hydration issues
const AvailabilityCalendar = dynamic(
  () => import("@/components/AvailabilityCalendar"),
  {
    ssr: false,
    loading: () => <CalendarSkeleton />
  }
);

export default function AvailabilityCalendarPage() {
  return (
    <div className="flex flex-col space-y-8 animate-fade-in">
      {/* Navigation Breadcrumbs */}
      <div className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-slate-350">Availability Calendar</span>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-900">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-300">
            My Availability Calendar
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Drag to create date overrides, edit override blocks, and view synced Google Calendar schedules.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/availability/recurring"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-855 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all hover:-translate-y-0.5 active:scale-95 shadow-md"
          >
            🗓️ Edit Weekly Pattern
          </Link>
        </div>
      </div>

      {/* Main Calendar View Wrapper */}
      <div className="mt-2">
        <AvailabilityCalendar />
      </div>
    </div>
  );
}
