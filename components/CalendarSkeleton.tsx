import React from "react";

export default function CalendarSkeleton() {
  return (
    <div className="w-full border border-slate-900 rounded-3xl p-6 bg-slate-900/10 backdrop-blur-sm shadow-2xl space-y-6 animate-pulse">
      {/* Toolbar Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-900 pb-4">
        {/* Left buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="h-9 w-20 bg-slate-800/80 rounded-xl"></div>
          <div className="h-9 w-10 bg-slate-800/80 rounded-xl"></div>
          <div className="h-9 w-10 bg-slate-800/80 rounded-xl"></div>
        </div>
        {/* Title */}
        <div className="h-6 w-44 bg-slate-800/80 rounded-xl"></div>
        {/* Right buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <div className="h-9 w-16 bg-slate-800/80 rounded-xl"></div>
          <div className="h-9 w-16 bg-slate-800/80 rounded-xl"></div>
          <div className="h-9 w-14 bg-slate-800/80 rounded-xl"></div>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="space-y-2">
        {/* Header row */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 bg-slate-800/60 rounded-lg"></div>
          ))}
        </div>
        
        {/* Time cells */}
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-2 h-16">
              {Array.from({ length: 7 }).map((_, j) => (
                <div
                  key={j}
                  className="h-full bg-slate-900/40 border border-slate-900/50 rounded-xl flex items-center justify-center animate-pulse"
                >
                  {/* Subtle placeholder line */}
                  <div className="h-1.5 w-8 bg-slate-800/30 rounded"></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
