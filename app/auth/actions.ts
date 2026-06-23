"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Persists the Google OAuth provider refresh token to the user's profile.
 * This is executed completely on the server-side.
 */
export async function saveGoogleRefreshToken(token: string) {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Unauthorized: No active user session." };
  }

  const { error: dbError } = await supabase
    .from("profiles")
    .update({
      google_refresh_token: token,
      calendar_sync_enabled: true,
    })
    .eq("id", user.id);

  if (dbError) {
    console.error("Error saving provider refresh token:", dbError);
    return { success: false, error: "Failed to persist Google refresh token in database." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { success: true };
}

/**
 * Clears the Google refresh token and disables calendar synchronization.
 */
export async function disconnectGoogleCalendar() {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Unauthorized: No active user session." };
  }

  const { error: dbError } = await supabase
    .from("profiles")
    .update({
      google_refresh_token: null,
      calendar_sync_enabled: false,
    })
    .eq("id", user.id);

  if (dbError) {
    console.error("Error disconnecting Google Calendar:", dbError);
    return { success: false, error: "Failed to clear calendar sync data." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { success: true };
}

/**
 * Signs the current user out.
 */
export async function signOutUser() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return { success: true };
}
