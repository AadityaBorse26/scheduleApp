/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
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

class MockServerQueryBuilder {
  private tableName: string;
  private filters: { field: string; value: any; operator?: string }[] = [];

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

  select(columns: string = "*") {
    return this;
  }

  async then(resolve: any) {
    const cookieStore = cookies();
    
    if (this.tableName === "profiles") {
      const profileStr = cookieStore.get("mock_profile")?.value;
      let profile = profileStr ? JSON.parse(profileStr) : {
        id: mockUser.id,
        name: mockUser.raw_user_meta_data.full_name,
        avatar_url: mockUser.raw_user_meta_data.avatar_url,
        timezone: "America/Los_Angeles",
        google_refresh_token: null,
        calendar_sync_enabled: false
      };
      
      // Apply filters
      let matches = true;
      for (const filter of this.filters) {
        if (profile[filter.field] !== filter.value) {
          matches = false;
          break;
        }
      }
      resolve({ data: matches ? [profile] : [], error: null });
      return;
    }

    if (this.tableName === "synced_busy_blocks") {
      const busyStr = cookieStore.get("mock_busy_blocks")?.value;
      let busyBlocks = busyStr ? JSON.parse(busyStr) : [];

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
      resolve({ data: filtered, error: null });
      return;
    }
    
    resolve({ data: [], error: null });
  }

  update(values: any) {
    const cookieStore = cookies();
    if (this.tableName === "profiles") {
      const profileStr = cookieStore.get("mock_profile")?.value;
      let profile = profileStr ? JSON.parse(profileStr) : {
        id: mockUser.id,
        name: mockUser.raw_user_meta_data.full_name,
        avatar_url: mockUser.raw_user_meta_data.avatar_url,
        timezone: "America/Los_Angeles",
        google_refresh_token: null,
        calendar_sync_enabled: false
      };

      const updated = { ...profile, ...values };
      try {
        cookieStore.set("mock_profile", JSON.stringify(updated), { path: "/" });
      } catch (err) {
        // Cookies cannot always be set during server component rendering
      }
      
      return {
        then: (resolve: any) => resolve({ data: [updated], error: null })
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
      let busyBlocks = busyStr ? JSON.parse(busyStr) : [];

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
      } catch (err) {}

      return {
        then: (resolve: any) => resolve({ data: remaining, error: null })
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
      let busyBlocks = busyStr ? JSON.parse(busyStr) : [];

      const rowsToInsert = Array.isArray(values) ? values : [values];
      const inserted = rowsToInsert.map(row => ({
        id: Math.random().toString(36).substring(2),
        last_synced_at: new Date().toISOString(),
        ...row
      }));

      busyBlocks.push(...inserted);

      try {
        cookieStore.set("mock_busy_blocks", JSON.stringify(busyBlocks), { path: "/" });
      } catch (err) {}

      return {
        select: () => ({
          then: (resolve: any) => resolve({ data: inserted, error: null })
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
    exchangeCodeForSession: async (code: string) => {
      try {
        cookieStore.set("mock_logged_in", "true", { path: "/" });
        const defaultProfile = {
          id: mockUser.id,
          name: mockUser.raw_user_meta_data.full_name,
          avatar_url: mockUser.raw_user_meta_data.avatar_url,
          timezone: "America/Los_Angeles",
          google_refresh_token: "mock_google_refresh_token_123",
          calendar_sync_enabled: true
        };
        cookieStore.set("mock_profile", JSON.stringify(defaultProfile), { path: "/" });
      } catch (err) {}

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
      } catch (err) {}
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
          } catch (error) {
            // Can be ignored if handled by middleware session update
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // Can be ignored if handled by middleware session update
          }
        },
      },
    }
  );
}
