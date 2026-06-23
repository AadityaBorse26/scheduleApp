/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOutUser } from "@/app/auth/actions";

interface AppHeaderClientProps {
  user: {
    name: string;
    avatarUrl: string;
    email: string;
  };
}

export default function AppHeaderClient({ user }: AppHeaderClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Availability", href: "/availability", icon: "🗓️" },
    { name: "Group Space", href: "/group", icon: "👥" },
    { name: "Settings & Help", href: "/settings", icon: "⚙️" },
  ];

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      // Execute signout server action
      await signOutUser();
      
      // In mock mode, the server action clears cookies, but let's also clear local state and force redirect
      if (typeof window !== "undefined") {
        document.cookie = "mock_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        document.cookie = "mock_profile=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      }
      
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
      setIsSigningOut(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md border-b border-slate-900 bg-slate-950/70">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Link href="/dashboard" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white text-md shadow-lg shadow-indigo-500/10 group-hover:scale-105 transition-transform">
              F
            </div>
            <span className="font-semibold text-md tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-300">
              FriendScheduler
            </span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 text-sm">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-slate-900 text-indigo-400 font-semibold border-b-2 border-indigo-500 shadow-inner"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Options */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 pr-2 border-r border-slate-900">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-slate-800 object-cover shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                {getInitials(user.name)}
              </div>
            )}
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-500">
                {user.email}
              </span>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-rose-400 disabled:opacity-50 transition-all duration-150 flex items-center space-x-1 shadow-md active:scale-95"
          >
            {isSigningOut ? (
              <span className="w-3.5 h-3.5 border border-slate-400 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>🚪</span>
                <span>Sign Out</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile navigation panel */}
      <div className="md:hidden flex border-t border-slate-900/50 bg-slate-950/90 text-xs py-2 justify-around">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center py-1 px-3 rounded-lg ${
                isActive ? "text-indigo-400 font-semibold" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className="text-lg mb-1">{link.icon}</span>
              <span>{link.name.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
