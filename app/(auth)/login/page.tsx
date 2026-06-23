/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

function LoginContent() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard";
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isProfilesLoading, setIsProfilesLoading] = useState(true);

  // Fetch all profiles on mount
  useEffect(() => {
    async function loadProfiles() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, avatar_url");
        if (!error && data) {
          setProfiles(data);
        } else if (error) {
          console.error("Error fetching profiles:", error);
        }
      } catch (err) {
        console.error("Profiles error:", err);
      } finally {
        setIsProfilesLoading(false);
      }
    }
    loadProfiles();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      
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

      // If mock client is used, it returns a URL to redirect to immediately
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Authentication error:", err);
      const error = err as Error;
      setErrorMsg(error.message || "An error occurred during Google sign-in. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 items-stretch px-4">
      
      {/* Left Area: Welcome & Social Authentication */}
      <div className="lg:col-span-5 p-8 rounded-3xl border border-slate-900 bg-slate-950/65 backdrop-blur-xl shadow-2xl flex flex-col justify-between items-center text-center">
        <div className="w-full flex flex-col items-center">
          {/* App Emblem */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-2xl shadow-xl shadow-indigo-500/20 mb-6">
            F
          </div>

          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-2">
            Welcome to FriendScheduler
          </h1>
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-5">
            🔑 Private Coordination Room
          </p>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-sm">
            Coordinate schedules, find common overlap slots, and sync Google Calendar events. Registration is restricted to our closed group.
          </p>

          {errorMsg && (
            <div className="w-full mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs leading-relaxed">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3.5 px-5 rounded-xl text-sm font-semibold flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-100 hover:bg-slate-850 hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200 group shadow-md"
          >
            {isLoading ? (
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
        </div>

        <div className="mt-8 text-center border-t border-slate-900/60 pt-4 w-full">
          <p className="text-[10px] text-slate-500 leading-relaxed max-w-[280px] mx-auto">
            By signing in, you grant access to your Google Calendar as a read-only source. Invite codes are skipped for registered profiles.
          </p>
        </div>
      </div>

      {/* Right Area: List of Group Members */}
      <div className="lg:col-span-7 p-8 rounded-3xl border border-slate-900 bg-slate-950/45 backdrop-blur-md shadow-2xl flex flex-col">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <span>👥</span>
            <span>Registered Group Members ({profiles.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            This is a private schedule coordination room. Verify you are in the correct place below:
          </p>
        </div>

        {isProfilesLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-3">
            <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
            <span className="text-xs text-slate-500">Retrieving members...</span>
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-12 text-xs text-slate-500 border border-dashed border-slate-850 rounded-2xl">
            No members registered yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[360px] pr-1">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-900/40 border border-slate-850 hover:border-indigo-500/20 hover:bg-slate-900/80 transition-all duration-200"
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name || "User"}
                    className="w-8 h-8 rounded-full border border-slate-700 object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-350 shadow-sm">
                    {(profile.name || "U")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-300 truncate">
                  {profile.name || "Unknown Coordinator"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background blobs */}
      <div className="absolute top-[20%] left-[20%] w-[350px] h-[350px] rounded-full bg-indigo-900/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[350px] h-[350px] rounded-full bg-purple-900/10 blur-[100px] pointer-events-none" />

      <Suspense fallback={
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Loading sign in...</p>
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
}
