export interface DateOverride {
  id?: string;
  user_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  status: "free" | "unavailable";
}

export interface SyncedBusyBlock {
  id?: string;
  user_id: string;
  start_datetime: string;
  end_datetime: string;
  source?: string;
  last_synced_at?: string;
}

export interface RecurringAvailability {
  id?: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface Profile {
  id: string;
  name: string | null;
  avatar_url?: string | null;
  timezone?: string | null;
  google_refresh_token?: string | null;
  calendar_sync_enabled?: boolean;
}
