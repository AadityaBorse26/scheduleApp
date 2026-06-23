import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-col space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-300">
          Account Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your schedule integrations, connected services, and default preferences.
        </p>
      </div>

      <SettingsForm 
        profile={profile || null}
        email={user.email || ""}
      />
    </div>
  );
}
