import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeaderClient from "./AppHeaderClient";
import ToastContainer from "@/components/Toast";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const supabase = createClient();
  
  // Verify user authentication state on the server
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Fetch profiles entry for the current user
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const userProfile = {
    name: profile?.name || user.email?.split("@")[0] || "Demo User",
    avatarUrl: profile?.avatar_url || "",
    email: user.email || "demo@friend-scheduler.local",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Visual background lights */}
      <div className="absolute top-[5%] left-[10%] w-[40%] h-[35%] rounded-full bg-indigo-950/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[5%] right-[10%] w-[45%] h-[35%] rounded-full bg-violet-950/10 blur-[130px] pointer-events-none" />

      {/* Header component */}
      <AppHeaderClient user={userProfile} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 relative z-10">
        {children}
      </main>

      {/* Global Toast Notification stack */}
      <ToastContainer />
    </div>
  );
}
