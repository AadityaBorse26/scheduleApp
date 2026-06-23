import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DaySchedule from "./DaySchedule";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  const [{ data: profile }, { data: patterns }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("recurring_availability").select("id").eq("user_id", user.id),
  ]);

  const name = profile?.name || user.email?.split("@")[0] || "there";
  const isSyncActive = !!(profile?.calendar_sync_enabled && profile?.google_refresh_token);
  const hasPatterns = !!(patterns && patterns.length > 0);

  return (
    <div className="animate-fade-in">
      <DaySchedule
        userId={user.id}
        name={name}
        isSyncActive={isSyncActive}
        hasPatterns={hasPatterns}
      />
    </div>
  );
}
