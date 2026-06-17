import dynamic from "next/dynamic";
import Link from "next/link";

// Dynamic import of the calendar component to bypass SSR hydration warnings with FullCalendar
const RecurringCalendar = dynamic(
  () => import("@/components/RecurringCalendar"),
  { ssr: false }
);

export default function RecurringAvailabilityPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-slate-300 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-slate-300">Recurring Availability</span>
        </div>

        {/* Title Section */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400">
            My Weekly Pattern
          </h1>
          
          {/* Explainer Callout Card */}
          <div className="p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-md max-w-3xl flex items-start space-x-4 shadow-md shadow-indigo-500/5">
            <span className="text-2xl mt-0.5">🗓️</span>
            <div>
              <p className="text-sm text-slate-300 font-medium leading-relaxed">
                This is your normal week. We&apos;ll layer your real Google Calendar and one-off changes on top of this automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Calendar Component */}
        <div className="mt-8">
          <RecurringCalendar />
        </div>
      </div>
    </div>
  );
}
