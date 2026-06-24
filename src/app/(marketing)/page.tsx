"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.push("/dashboard");
        } else {
          setIsRedirecting(false);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setIsRedirecting(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback?next=/dashboard`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          scopes: "https://www.googleapis.com/auth/calendar.readonly",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Auth error:", err);
      setIsGoogleLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setIsDemoLoading(true);
    
    // Set cookies to activate mock mode client & server side
    document.cookie = "mock_logged_in=true; path=/; max-age=86400";
    
    const defaultProfile = {
      id: "mock-user-1111-2222-3333-444444444444",
      name: "Demo User",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80",
      timezone: "America/Los_Angeles",
      google_refresh_token: "mock_google_refresh_token_123",
      calendar_sync_enabled: true,
      last_synced_at: null
    };
    document.cookie = `mock_profile=${encodeURIComponent(JSON.stringify(defaultProfile))}; path=/; max-age=86400`;
    
    // Smooth transition
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 400);
  };

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-[20%] left-[20%] w-[350px] h-[350px] rounded-full bg-indigo-900/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[20%] w-[350px] h-[350px] rounded-full bg-purple-900/10 blur-[100px] pointer-events-none" />
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium tracking-wide">Loading FriendScheduler...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/15 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-900/15 blur-[130px] pointer-events-none" />

      {/* Main Glassmorphic Portal Card */}
      <div className="w-full max-w-md p-8 rounded-3xl border border-slate-900 bg-slate-950/65 backdrop-blur-xl shadow-2xl shadow-indigo-950/10 flex flex-col items-center text-center relative z-10">
        
        {/* Glowing Logo Emblem */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-3xl shadow-xl shadow-indigo-500/25 mb-6 transition-all hover:scale-105 hover:rotate-3 duration-300">
          F
        </div>

        {/* Application Name */}
        <h1 className="text-3xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400">
          FriendScheduler
        </h1>

        {/* App Subtitle */}
        <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6">
          🗓️ Schedule Coordination Portal
        </p>

        {/* Short details */}
        <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-xs">
          Coordinate schedules, overlay calendars, and discover common free slots with your friends in seconds.
        </p>

        {/* Action Panel */}
        <div className="w-full space-y-4">
          {/* Sign In with Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isDemoLoading}
            className="w-full py-3.5 px-5 rounded-xl text-sm font-semibold flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-100 hover:bg-slate-850 hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200 group shadow-md"
          >
            {isGoogleLoading ? (
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                <span>Connecting to Google...</span>
              </div>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.98-2.92 3.7-5.51 6.76-5.51z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.1 2.66-2.33 3.49v2.9h3.76c2.2-2.02 3.63-5.01 3.63-8.54z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.24 14.81c-.25-.76-.39-1.57-.39-2.41s.14-1.65.39-2.41L1.39 7.01C.5 8.81 0 10.84 0 13c0 2.16.5 4.19 1.39 5.99l3.85-3.18z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.76-2.9c-1.1.74-2.5 1.18-4.2 1.18-3.06 0-5.78-2.59-6.76-5.51l-3.85 2.99C3.37 20.33 7.35 23 12 23z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Try Demo Mode */}
          <button
            onClick={handleDemoLogin}
            disabled={isGoogleLoading || isDemoLoading}
            className="w-full py-3.5 px-5 rounded-xl text-sm font-semibold flex items-center justify-center bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200"
          >
            {isDemoLoading ? (
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Setting up Demo...</span>
              </div>
            ) : (
              <span>Explore Demo Dashboard</span>
            )}
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center border-t border-slate-900/60 pt-5 w-full">
          <p className="text-[10px] text-slate-500 leading-relaxed max-w-[280px] mx-auto">
            Authorized sign in syncs Google Calendar (read-only) for scheduling conflicts. Try Demo Mode to explore with sample data.
          </p>
        </div>

      </div>
    </div>
  );
}
