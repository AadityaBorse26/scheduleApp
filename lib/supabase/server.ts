/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const mockUser = {
  id: "mock-user-1111-2222-3333-444444444444",
  email: "demo@friend-scheduler.local",
  raw_user_meta_data: {
    full_name: "Demo User",
    name: "Demo User",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80",
  }
};

const extraMockProfiles = [
  { id: "mock-user-alice-2222-3333-444444444444", name: "Alice", avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80", timezone: "America/Los_Angeles", google_refresh_token: null, calendar_sync_enabled: false },
  { id: "mock-user-bob-2222-3333-444444444444", name: "Bob", avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80", timezone: "America/Los_Angeles", google_refresh_token: null, calendar_sync_enabled: false },
  { id: "mock-user-charlie-2222-3333-444444444444", name: "Charlie", avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80", timezone: "America/Los_Angeles", google_refresh_token: null, calendar_sync_enabled: false },
  { id: "mock-user-david-2222-3333-444444444444", name: "David", avatar_url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&h=256&q=80", timezone: "America/Los_Angeles", google_refresh_token: null, calendar_sync_enabled: false },
  { id: "mock-user-eve-2222-3333-444444444444", name: "Eve", avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80", timezone: "America/Los_Angeles", google_refresh_token: null, calendar_sync_enabled: false },
  { id: "mock-user-frank-2222-3333-444444444444", name: "Frank", avatar_url: "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=256&h=256&q=80", timezone: "America/Los_Angeles", google_refresh_token: null, calendar_sync_enabled: false },
  { id: "mock-user-grace-2222-3333-444444444444", name: "Grace", avatar_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=256&h=256&q=80", timezone: "America/Los_Angeles", google_refresh_token: null, calendar_sync_enabled: false },
  { id: "mock-user-henry-2222-3333-444444444444", name: "Henry", avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80", timezone: "America/Los_Angeles", google_refresh_token: null, calendar_sync_enabled: false },
  { id: "mock-user-ivy-2222-3333-444444444444", name: "Ivy", avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80", timezone: "America/Los_Angeles", google_refresh_token: null, calendar_sync_enabled: false },
  { id: "mock-user-jack-2222-3333-444444444444", name: "Jack", avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80", timezone: "America/Los_Angeles", google_refresh_token: null, calendar_sync_enabled: false },
  { id: "mock-user-karen-2222-3333-444444444444", name: "Karen", avatar_url: "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=256&h=256&q=80", timezone: "America/Los_Angeles", google_refresh_token: null, calendar_sync_enabled: false }
];

const extraMockPatterns = [
  // Alice: Mon/Wed/Fri 9am-5pm
  { id: "pat-alice-1", user_id: "mock-user-alice-2222-3333-444444444444", day_of_week: 1, start_time: "09:00:00", end_time: "17:00:00" },
  { id: "pat-alice-2", user_id: "mock-user-alice-2222-3333-444444444444", day_of_week: 3, start_time: "09:00:00", end_time: "17:00:00" },
  { id: "pat-alice-3", user_id: "mock-user-alice-2222-3333-444444444444", day_of_week: 5, start_time: "09:00:00", end_time: "17:00:00" },
  // Bob: Tue/Thu 10am-4pm
  { id: "pat-bob-1", user_id: "mock-user-bob-2222-3333-444444444444", day_of_week: 2, start_time: "10:00:00", end_time: "16:00:00" },
  { id: "pat-bob-2", user_id: "mock-user-bob-2222-3333-444444444444", day_of_week: 4, start_time: "10:00:00", end_time: "16:00:00" },
  // Charlie: Mon-Fri 1pm-6pm
  { id: "pat-charlie-1", user_id: "mock-user-charlie-2222-3333-444444444444", day_of_week: 1, start_time: "13:00:00", end_time: "18:00:00" },
  { id: "pat-charlie-2", user_id: "mock-user-charlie-2222-3333-444444444444", day_of_week: 2, start_time: "13:00:00", end_time: "18:00:00" },
  { id: "pat-charlie-3", user_id: "mock-user-charlie-2222-3333-444444444444", day_of_week: 3, start_time: "13:00:00", end_time: "18:00:00" },
  { id: "pat-charlie-4", user_id: "mock-user-charlie-2222-3333-444444444444", day_of_week: 4, start_time: "13:00:00", end_time: "18:00:00" },
  { id: "pat-charlie-5", user_id: "mock-user-charlie-2222-3333-444444444444", day_of_week: 5, start_time: "13:00:00", end_time: "18:00:00" },
  // David: Mon-Fri 8am-12pm
  { id: "pat-david-1", user_id: "mock-user-david-2222-3333-444444444444", day_of_week: 1, start_time: "08:00:00", end_time: "12:00:00" },
  { id: "pat-david-2", user_id: "mock-user-david-2222-3333-444444444444", day_of_week: 2, start_time: "08:00:00", end_time: "12:00:00" },
  { id: "pat-david-3", user_id: "mock-user-david-2222-3333-444444444444", day_of_week: 3, start_time: "08:00:00", end_time: "12:00:00" },
  { id: "pat-david-4", user_id: "mock-user-david-2222-3333-444444444444", day_of_week: 4, start_time: "08:00:00", end_time: "12:00:00" },
  { id: "pat-david-5", user_id: "mock-user-david-2222-3333-444444444444", day_of_week: 5, start_time: "08:00:00", end_time: "12:00:00" },
  // Eve: Sat/Sun 10am-8pm
  { id: "pat-eve-1", user_id: "mock-user-eve-2222-3333-444444444444", day_of_week: 0, start_time: "10:00:00", end_time: "20:00:00" },
  { id: "pat-eve-2", user_id: "mock-user-eve-2222-3333-444444444444", day_of_week: 6, start_time: "10:00:00", end_time: "20:00:00" },
  // Frank: Mon-Thu 2pm-8pm
  { id: "pat-frank-1", user_id: "mock-user-frank-2222-3333-444444444444", day_of_week: 1, start_time: "14:00:00", end_time: "20:00:00" },
  { id: "pat-frank-2", user_id: "mock-user-frank-2222-3333-444444444444", day_of_week: 2, start_time: "14:00:00", end_time: "20:00:00" },
  { id: "pat-frank-3", user_id: "mock-user-frank-2222-3333-444444444444", day_of_week: 3, start_time: "14:00:00", end_time: "20:00:00" },
  { id: "pat-frank-4", user_id: "mock-user-frank-2222-3333-444444444444", day_of_week: 4, start_time: "14:00:00", end_time: "20:00:00" },
  // Grace: Wed/Fri 10am-3pm
  { id: "pat-grace-1", user_id: "mock-user-grace-2222-3333-444444444444", day_of_week: 3, start_time: "10:00:00", end_time: "15:00:00" },
  { id: "pat-grace-2", user_id: "mock-user-grace-2222-3333-444444444444", day_of_week: 5, start_time: "10:00:00", end_time: "15:00:00" },
  // Henry: Tue/Thu/Fri 9am-1pm
  { id: "pat-henry-1", user_id: "mock-user-henry-2222-3333-444444444444", day_of_week: 2, start_time: "09:00:00", end_time: "13:00:00" },
  { id: "pat-henry-2", user_id: "mock-user-henry-2222-3333-444444444444", day_of_week: 4, start_time: "09:00:00", end_time: "13:00:00" },
  { id: "pat-henry-3", user_id: "mock-user-henry-2222-3333-444444444444", day_of_week: 5, start_time: "09:00:00", end_time: "13:00:00" },
  // Ivy: Mon-Fri 3pm-7pm
  { id: "pat-ivy-1", user_id: "mock-user-ivy-2222-3333-444444444444", day_of_week: 1, start_time: "15:00:00", end_time: "19:00:00" },
  { id: "pat-ivy-2", user_id: "mock-user-ivy-2222-3333-444444444444", day_of_week: 2, start_time: "15:00:00", end_time: "19:00:00" },
  { id: "pat-ivy-3", user_id: "mock-user-ivy-2222-3333-444444444444", day_of_week: 3, start_time: "15:00:00", end_time: "19:00:00" },
  { id: "pat-ivy-4", user_id: "mock-user-ivy-2222-3333-444444444444", day_of_week: 4, start_time: "15:00:00", end_time: "19:00:00" },
  { id: "pat-ivy-5", user_id: "mock-user-ivy-2222-3333-444444444444", day_of_week: 5, start_time: "15:00:00", end_time: "19:00:00" },
  // Jack: Sat 9am-5pm
  { id: "pat-jack-1", user_id: "mock-user-jack-2222-3333-444444444444", day_of_week: 6, start_time: "09:00:00", end_time: "17:00:00" },
  // Karen: Mon/Wed 12pm-5pm
  { id: "pat-karen-1", user_id: "mock-user-karen-2222-3333-444444444444", day_of_week: 1, start_time: "12:00:00", end_time: "17:00:00" },
  { id: "pat-karen-2", user_id: "mock-user-karen-2222-3333-444444444444", day_of_week: 3, start_time: "12:00:00", end_time: "17:00:00" }
];

export class MockServerQueryBuilder {
  private tableName: string;
  private filters: { field: string; value: any; operator?: string }[] = [];
  private isSingle: boolean = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, value });
    return this;
  }

  gte(field: string, value: any) {
    this.filters.push({ field, value, operator: "gte" });
    return this;
  }

  lte(field: string, value: any) {
    this.filters.push({ field, value, operator: "lte" });
    return this;
  }

  select(_columns: string = "*") {
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  then(resolve: any) {
    const cookieStore = cookies();
    
    if (this.tableName === "profiles") {
      const profileStr = cookieStore.get("mock_profile")?.value;
      const profile = profileStr ? JSON.parse(profileStr) : {
        id: mockUser.id,
        name: mockUser.raw_user_meta_data.full_name,
        avatar_url: mockUser.raw_user_meta_data.avatar_url,
        timezone: "America/Los_Angeles",
        google_refresh_token: null,
        calendar_sync_enabled: false,
        last_synced_at: null
      };
      
      const allProfiles = [profile, ...extraMockProfiles];
      const filtered = allProfiles.filter((row: any) => {
        return this.filters.every(filter => row[filter.field] === filter.value);
      });
      
      resolve({ 
        data: this.isSingle ? (filtered[0] || null) : filtered, 
        error: null 
      });
      return;
    }

    if (this.tableName === "recurring_availability") {
      const patternStr = cookieStore.get("mock_recurring_patterns")?.value;
      const userPatterns = patternStr ? JSON.parse(patternStr) : [
        {
          id: "init-1",
          user_id: mockUser.id,
          day_of_week: 1, // Monday
          start_time: "09:00:00",
          end_time: "12:00:00"
        },
        {
          id: "init-2",
          user_id: mockUser.id,
          day_of_week: 3, // Wednesday
          start_time: "14:00:00",
          end_time: "17:00:00"
        }
      ];

      const allPatterns = [...userPatterns, ...extraMockPatterns];
      const filtered = allPatterns.filter((row: any) => {
        return this.filters.every(filter => row[filter.field] === filter.value);
      });

      resolve({ 
        data: this.isSingle ? (filtered[0] || null) : filtered, 
        error: null 
      });
      return;
    }

    if (this.tableName === "synced_busy_blocks") {
      const busyStr = cookieStore.get("mock_busy_blocks")?.value;
      const busyBlocks = busyStr ? JSON.parse(busyStr) : [];

      const filtered = busyBlocks.filter((row: any) => {
        return this.filters.every(filter => {
          if (filter.operator === "gte") {
            return new Date(row[filter.field]) >= new Date(filter.value);
          }
          if (filter.operator === "lte") {
            return new Date(row[filter.field]) <= new Date(filter.value);
          }
          return row[filter.field] === filter.value;
        });
      });
      resolve({ 
        data: this.isSingle ? (filtered[0] || null) : filtered, 
        error: null 
      });
      return;
    }

    if (this.tableName === "date_overrides") {
      const overridesStr = cookieStore.get("mock_overrides")?.value;
      const overrides = overridesStr ? JSON.parse(overridesStr) : [];
      
      const filtered = overrides.filter((row: any) => {
        return this.filters.every(filter => {
          return row[filter.field] === filter.value;
        });
      });
      resolve({ 
        data: this.isSingle ? (filtered[0] || null) : filtered, 
        error: null 
      });
      return;
    }
    
    resolve({ data: this.isSingle ? null : [], error: null });
  }

  update(values: any) {
    const cookieStore = cookies();
    if (this.tableName === "profiles") {
      const profileStr = cookieStore.get("mock_profile")?.value;
      const profile = profileStr ? JSON.parse(profileStr) : {
        id: mockUser.id,
        name: mockUser.raw_user_meta_data.full_name,
        avatar_url: mockUser.raw_user_meta_data.avatar_url,
        timezone: "America/Los_Angeles",
        google_refresh_token: null,
        calendar_sync_enabled: false,
        last_synced_at: null
      };

      const updated = { ...profile, ...values };
      try {
        cookieStore.set("mock_profile", JSON.stringify(updated), { path: "/" });
      } catch {
        // Cookies cannot always be set during server component rendering
      }
      
      return {
        then: (resolve: any) => resolve({ data: [updated], error: null })
      };
    }

    if (this.tableName === "date_overrides") {
      const overridesStr = cookieStore.get("mock_overrides")?.value;
      const overrides = overridesStr ? JSON.parse(overridesStr) : [];
      const updatedRows: any[] = [];

      const modified = overrides.map((row: any) => {
        const matches = this.filters.every(filter => row[filter.field] === filter.value);
        if (matches) {
          const updated = { ...row, ...values };
          updatedRows.push(updated);
          return updated;
        }
        return row;
      });

      try {
        cookieStore.set("mock_overrides", JSON.stringify(modified), { path: "/" });
      } catch {}

      return {
        then: (resolve: any) => resolve({ data: updatedRows, error: null })
      };
    }

    return {
      then: (resolve: any) => resolve({ data: [], error: null })
    };
  }

  delete() {
    const cookieStore = cookies();
    if (this.tableName === "synced_busy_blocks") {
      const busyStr = cookieStore.get("mock_busy_blocks")?.value;
      const busyBlocks = busyStr ? JSON.parse(busyStr) : [];

      const remaining = busyBlocks.filter((row: any) => {
        const matches = this.filters.every(filter => {
          if (filter.operator === "gte") {
            return new Date(row[filter.field]) >= new Date(filter.value);
          }
          if (filter.operator === "lte") {
            return new Date(row[filter.field]) <= new Date(filter.value);
          }
          return row[filter.field] === filter.value;
        });
        return !matches;
      });

      try {
        cookieStore.set("mock_busy_blocks", JSON.stringify(remaining), { path: "/" });
      } catch {}

      return {
        then: (resolve: any) => resolve({ data: remaining, error: null })
      };
    }

    if (this.tableName === "date_overrides") {
      const overridesStr = cookieStore.get("mock_overrides")?.value;
      const overrides = overridesStr ? JSON.parse(overridesStr) : [];

      const remaining = overrides.filter((row: any) => {
        const matches = this.filters.every(filter => row[filter.field] === filter.value);
        return !matches;
      });

      const deleted = overrides.filter((row: any) => {
        return this.filters.every(filter => row[filter.field] === filter.value);
      });

      try {
        cookieStore.set("mock_overrides", JSON.stringify(remaining), { path: "/" });
      } catch {}

      return {
        then: (resolve: any) => resolve({ data: deleted, error: null })
      };
    }

    return {
      then: (resolve: any) => resolve({ data: [], error: null })
    };
  }

  insert(values: any | any[]) {
    const cookieStore = cookies();
    if (this.tableName === "synced_busy_blocks") {
      const busyStr = cookieStore.get("mock_busy_blocks")?.value;
      const busyBlocks = busyStr ? JSON.parse(busyStr) : [];

      const rowsToInsert = Array.isArray(values) ? values : [values];
      const inserted = rowsToInsert.map(row => ({
        id: Math.random().toString(36).substring(2),
        last_synced_at: new Date().toISOString(),
        ...row
      }));

      busyBlocks.push(...inserted);

      try {
        cookieStore.set("mock_busy_blocks", JSON.stringify(busyBlocks), { path: "/" });
      } catch {}

      return {
        select: () => ({
          then: (resolve: any) => resolve({ data: inserted, error: null })
        }),
        then: (resolve: any) => resolve({ data: inserted, error: null })
      };
    }

    if (this.tableName === "date_overrides") {
      const overridesStr = cookieStore.get("mock_overrides")?.value;
      const overrides = overridesStr ? JSON.parse(overridesStr) : [];

      const rowsToInsert = Array.isArray(values) ? values : [values];
      const inserted = rowsToInsert.map(row => ({
        id: Math.random().toString(36).substring(2),
        ...row
      }));

      overrides.push(...inserted);

      try {
        cookieStore.set("mock_overrides", JSON.stringify(overrides), { path: "/" });
      } catch {}

      return {
        select: () => ({
          single: () => ({
            then: (resolve: any) => resolve({ data: inserted[0], error: null })
          }),
          then: (resolve: any) => resolve({ data: inserted, error: null })
        }),
        single: () => ({
          then: (resolve: any) => resolve({ data: inserted[0], error: null })
        }),
        then: (resolve: any) => resolve({ data: inserted, error: null })
      };
    }

    return {
      then: (resolve: any) => resolve({ data: [], error: null })
    };
  }
}

export function createMockServerClient() {
  const cookieStore = cookies();
  const isLoggedIn = cookieStore.get("mock_logged_in")?.value === "true";

  const mockAuth = {
    getUser: async () => {
      if (isLoggedIn) {
        return { data: { user: mockUser }, error: null };
      }
      return { data: { user: null }, error: { message: "Not logged in" } };
    },
    getSession: async () => {
      if (isLoggedIn) {
        const profileStr = cookieStore.get("mock_profile")?.value;
        const profile = profileStr ? JSON.parse(profileStr) : null;
        
        return { 
          data: { 
            session: { 
              user: mockUser, 
              provider_refresh_token: profile?.google_refresh_token || "mock_google_refresh_token_123" 
            } 
          }, 
          error: null 
        };
      }
      return { data: { session: null }, error: null };
    },
    exchangeCodeForSession: async (_code: string) => {
      try {
        cookieStore.set("mock_logged_in", "true", { path: "/" });
        const defaultProfile = {
          id: mockUser.id,
          name: mockUser.raw_user_meta_data.full_name,
          avatar_url: mockUser.raw_user_meta_data.avatar_url,
          timezone: "America/Los_Angeles",
          google_refresh_token: "mock_google_refresh_token_123",
          calendar_sync_enabled: true,
          last_synced_at: null
        };
        cookieStore.set("mock_profile", JSON.stringify(defaultProfile), { path: "/" });
      } catch {}

      return {
        data: {
          session: {
            user: mockUser,
            provider_refresh_token: "mock_google_refresh_token_123"
          }
        },
        error: null
      };
    },
    signOut: async () => {
      try {
        cookieStore.set("mock_logged_in", "false", { path: "/", maxAge: -1 });
        cookieStore.set("mock_profile", "", { path: "/", maxAge: -1 });
      } catch {}
      return { error: null };
    }
  };

  return {
    auth: mockAuth,
    from: (tableName: string) => {
      return new MockServerQueryBuilder(tableName);
    }
  };
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isConfigured =
    !!supabaseUrl &&
    supabaseUrl !== "your-supabase-project-url" &&
    supabaseUrl.startsWith("https://") &&
    !!supabaseAnonKey &&
    supabaseAnonKey !== "your-supabase-anon-key";

  if (!isConfigured) {
    return createMockServerClient() as any;
  }

  const cookieStore = cookies();

  return createServerClient(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Can be ignored if handled by middleware session update
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Can be ignored if handled by middleware session update
          }
        },
      },
    }
  );
}
