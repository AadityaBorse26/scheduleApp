"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

import CalendarSkeleton from "@/components/CalendarSkeleton";

// Dynamically import to avoid SSR issues with browser-only APIs (window, etc.)
const GroupCalendar = dynamic(
  () => import("@/components/GroupCalendar"),
  {
    ssr: false,
    loading: () => <CalendarSkeleton />
  }
);

export default function GroupPage() {
  return (
    <div className="flex flex-col space-y-8 animate-fade-in">
      {/* Navigation Breadcrumbs */}
      <div className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/dashboard" className="hover:text-slate-300 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-350">Group Rooms</span>
      </div>

      {/* Header Title Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-900">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-300">
            Group Coordination Room
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Overlay friend schedules and search the visual heatmap to locate optimal meeting windows.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/availability"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-855 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all hover:-translate-y-0.5 active:scale-95 shadow-md"
          >
            ✏️ Manage My Calendar
          </Link>
        </div>
      </div>

      {/* Interactive Group Heatmap Calendar component */}
      <div className="mt-2">
        <GroupCalendar />
      </div>
    </div>
  );
}
