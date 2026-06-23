import { createClient } from "@/lib/supabase/server";

/**
 * Syncs Google Calendar busy blocks for a given user for the next 60 days.
 * If the refresh token is invalid/revoked, it automatically disables sync in profiles.
 */
export async function syncGoogleCalendar(userId: string) {
  const supabase = createClient();
  
  // 1. Fetch user's google_refresh_token
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("google_refresh_token")
    .eq("id", userId)
    .single();
    
  if (profileError || !profile || !profile.google_refresh_token) {
    return { 
      success: false, 
      error: "Google Calendar is not connected. Connect your calendar in Settings." 
    };
  }

  // Handle local development sandbox mock environment
  const isMock = profile.google_refresh_token.startsWith("mock_");
  if (isMock) {
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
    
    // Clear out old mock busy blocks
    await supabase
      .from("synced_busy_blocks")
      .delete()
      .eq("user_id", userId)
      .eq("source", "google")
      .gte("start_datetime", timeMin)
      .lte("end_datetime", timeMax);

    // Create mock busy intervals for the next few days
    const now = new Date();
    
    // Tomorrow 10am to 12pm
    const d1_start = new Date(now);
    d1_start.setDate(now.getDate() + 1);
    d1_start.setHours(10, 0, 0, 0);
    const d1_end = new Date(d1_start);
    d1_end.setHours(12, 0, 0, 0);
    
    // Day after tomorrow 2pm to 4pm
    const d2_start = new Date(now);
    d2_start.setDate(now.getDate() + 2);
    d2_start.setHours(14, 0, 0, 0);
    const d2_end = new Date(d2_start);
    d2_end.setHours(16, 0, 0, 0);
    
    // Next Monday 9am to 11am
    const d3_start = new Date(now);
    d3_start.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
    d3_start.setHours(9, 0, 0, 0);
    const d3_end = new Date(d3_start);
    d3_end.setHours(11, 0, 0, 0);

    const blocksToInsert = [
      { user_id: userId, start_datetime: d1_start.toISOString(), end_datetime: d1_end.toISOString(), source: "google" },
      { user_id: userId, start_datetime: d2_start.toISOString(), end_datetime: d2_end.toISOString(), source: "google" },
      { user_id: userId, start_datetime: d3_start.toISOString(), end_datetime: d3_end.toISOString(), source: "google" }
    ];

    const { error: insertError } = await supabase
      .from("synced_busy_blocks")
      .insert(blocksToInsert);

    if (insertError) {
      console.error("Mock sync insert error:", insertError);
      return { success: false, error: "Failed to save mock busy blocks." };
    }

    // Update last_synced_at timestamp on user profile
    await supabase
      .from("profiles")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", userId);

    return { success: true, count: blocksToInsert.length };
  }

  // Real Google Calendar Integration Sync
  try {
    const client_id = process.env.GOOGLE_CLIENT_ID;
    const client_secret = process.env.GOOGLE_CLIENT_SECRET;
    
    // 2. Obtain a fresh access token from Google
    const params = new URLSearchParams();
    params.append("client_id", client_id || "");
    params.append("client_secret", client_secret || "");
    params.append("refresh_token", profile.google_refresh_token);
    params.append("grant_type", "refresh_token");

    const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const refreshData = await refreshResponse.json();

    if (!refreshResponse.ok || refreshData.error) {
      console.error("Google Token Refresh failed. Disabling calendar sync...", refreshData);
      
      // Token is invalid/revoked: set calendar_sync_enabled to false and clear token
      await supabase
        .from("profiles")
        .update({
          calendar_sync_enabled: false,
          google_refresh_token: null
        })
        .eq("id", userId);

      return { 
        success: false, 
        error: "Google Calendar permission has been revoked or has expired. Please reconnect in Settings.",
        reconnectRequired: true 
      };
    }

    const accessToken = refreshData.access_token;
    
    // 3. Query Google Calendar FreeBusy API
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days

    const freeBusyResponse = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        items: [{ id: "primary" }]
      })
    });

    const freeBusyData = await freeBusyResponse.json();

    if (!freeBusyResponse.ok) {
      console.error("Google FreeBusy request failed:", freeBusyData);
      return { success: false, error: "Failed to query Google Calendar schedules." };
    }

    const primaryCal = freeBusyData.calendars?.primary;
    const busyIntervals = primaryCal?.busy || [];

    // 4. Delete existing google synced blocks in the date range
    const { error: deleteError } = await supabase
      .from("synced_busy_blocks")
      .delete()
      .eq("user_id", userId)
      .eq("source", "google")
      .gte("start_datetime", timeMin)
      .lte("end_datetime", timeMax);

    if (deleteError) {
      console.error("DB error clearing synced blocks:", deleteError);
      return { success: false, error: "Failed to update busy intervals in database." };
    }

    // 5. Insert new busy blocks
    if (busyIntervals.length > 0) {
      const blocksToInsert = busyIntervals.map((interval: { start: string; end: string }) => ({
        user_id: userId,
        start_datetime: interval.start,
        end_datetime: interval.end,
        source: "google",
      }));

      const { error: insertError } = await supabase
        .from("synced_busy_blocks")
        .insert(blocksToInsert);

      if (insertError) {
        console.error("DB error inserting synced blocks:", insertError);
        return { success: false, error: "Failed to persist synced busy blocks in database." };
      }
    }

    // Update last_synced_at timestamp on user profile
    await supabase
      .from("profiles")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", userId);

    return { success: true, count: busyIntervals.length };
  } catch (err) {
    console.error("Google Calendar Sync Error:", err);
    const error = err as Error;
    return { success: false, error: error.message || "An unexpected error occurred during sync." };
  }
}
