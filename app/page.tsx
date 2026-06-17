import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/20 blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-slate-900 bg-slate-950/70">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-indigo-500/20">
              F
            </div>
            <span className="font-semibold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-300">
              FriendScheduler
            </span>
          </div>

          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/dashboard" className="text-slate-400 hover:text-slate-200 transition-colors">
              Dashboard
            </Link>
            <Link href="/availability" className="text-slate-400 hover:text-slate-200 transition-colors">
              Availability
            </Link>
            <Link href="/group" className="text-slate-400 hover:text-slate-200 transition-colors">
              Group
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center relative z-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-xs text-indigo-400 mb-6 animate-pulse">
          <span>✨</span>
          <span>Next.js 14 + Tailwind CSS + Supabase Stack</span>
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl leading-tight">
          Find the perfect time to meet,{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400">
            stress-free.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
          FriendScheduler combines your availability, syncs with Google Calendar, and allows you to find common free time slots with your friends in seconds.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-24">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:scale-95 text-center"
          >
            Get Started Free
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-semibold bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all hover:-translate-y-0.5 active:scale-95 text-center"
          >
            View Demo Dashboard
          </Link>
        </div>

        {/* Feature Grid */}
        <section className="grid md:grid-cols-3 gap-8 w-full max-w-5xl text-left">
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/30 backdrop-blur-sm hover:border-slate-800 hover:bg-slate-900/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
              🗓️
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-200">Interactive Calendar</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Powered by FullCalendar for a smooth, interactive schedule editing experience. Drag, drop, and configure slots with ease.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/30 backdrop-blur-sm hover:border-slate-800 hover:bg-slate-900/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-6 group-hover:scale-110 transition-transform">
              🔗
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-200">Google Calendar Sync</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Real-time Google OAuth synchronization checks your busy slots automatically, protecting you from scheduling conflicts.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/30 backdrop-blur-sm hover:border-slate-800 hover:bg-slate-900/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 mb-6 group-hover:scale-110 transition-transform">
              👥
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-200">Group Availability</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Invite friends to a group space, overlay calendars, and instantly see overlapping free slots without sharing private event details.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 mt-20 bg-slate-950/50 py-10 text-center text-sm text-slate-500 relative z-10">
        <p className="mb-2">© {new Date().getFullYear()} FriendScheduler. Built with Next.js 14 and Supabase.</p>
        <div className="flex gap-4 justify-center">
          <Link href="/availability" className="hover:text-slate-350 transition-colors">Availability</Link>
          <Link href="/group" className="hover:text-slate-350 transition-colors">Group</Link>
          <Link href="/login" className="hover:text-slate-350 transition-colors">Login</Link>
        </div>
      </footer>
    </div>
  );
}

