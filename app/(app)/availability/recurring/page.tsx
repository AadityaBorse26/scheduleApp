import dynamic from "next/dynamic";
import Link from "next/link";

import CalendarSkeleton from "@/components/CalendarSkeleton";

// Dynamic import of the calendar component to bypass SSR hydration warnings with FullCalendar
const RecurringCalendar = dynamic(
  () => import("@/components/RecurringCalendar"),
  {
    ssr: false,
    loading: () => <CalendarSkeleton />
  }
);

export default function RecurringAvailabilityPage() {
  return (
    <div className="flex flex-col space-y-8 animate-fade-in">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/availability/calendar" className="hover:text-slate-300 transition-colors">Availability Calendar</Link>
        <span>/</span>
        <span className="text-slate-355">Weekly Pattern</span>
      </div>

      {/* Title Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-900">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-300">
            My Weekly Pattern
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Specify your recurring default availability blocks on the interactive weekly calendar.
          </p>
        </div>
        
        {/* Explainer Callout Card */}
        <div className="p-4 rounded-2xl border border-indigo-500/10 bg-indigo-500/5 max-w-md flex items-start space-x-3 text-xs leading-relaxed text-indigo-300 shadow-md">
          <span className="text-lg">🗓️</span>
          <p>
            This is your normal week. We&apos;ll layer your real Google Calendar and one-off changes on top of this automatically.
          </p>
        </div>
      </div>

      {/* Interactive Calendar Component */}
      <div className="mt-2">
        <RecurringCalendar />
      </div>
    </div>
  );
}
