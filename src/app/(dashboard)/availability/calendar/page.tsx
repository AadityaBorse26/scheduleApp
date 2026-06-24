"use client";

import dynamic from "next/dynamic";
import CalendarSkeleton from "@/features/calendar/components/CalendarSkeleton";

// SSR disabled — FullCalendar uses browser APIs
const AvailabilityCalendar = dynamic(
  () => import("@/features/calendar/components/AvailabilityCalendar"),
  { ssr: false, loading: () => <CalendarSkeleton /> }
);

export default function AvailabilityCalendarPage() {
  // Page is just a full-height shell — all chrome lives inside the component
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col animate-fade-in -mx-6 -mt-10 px-0">
      <AvailabilityCalendar />
    </div>
  );
}
