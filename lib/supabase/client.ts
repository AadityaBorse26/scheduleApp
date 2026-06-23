/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const, @next/next/no-img-element */
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured = 
  !!supabaseUrl && 
  supabaseUrl !== 'your-supabase-project-url' && 
  supabaseUrl.startsWith('https://') &&
  !!supabaseAnonKey && 
  supabaseAnonKey !== 'your-supabase-anon-key';

// Mock DB configuration for local sandboxed development
const mockUser = {
  id: 'mock-user-1111-2222-3333-444444444444',
  email: 'demo@friend-scheduler.local',
  raw_user_meta_data: {
    full_name: 'Demo User',
    name: 'Demo User',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
  }
};

class MockInsertBuilder {
  private insertedRows: any[];
  constructor(insertedRows: any[]) {
    this.insertedRows = insertedRows;
  }
  select() {
    return this;
  }
  then(resolve: any) {
    resolve({ data: this.insertedRows, error: null });
  }
}

class MockUpdateBuilder {
  private updatedRows: any[];
  constructor(updatedRows: any[]) {
    this.updatedRows = updatedRows;
  }
  then(resolve: any) {
    resolve({ data: this.updatedRows, error: null });
  }
}

class MockDeleteBuilder {
  private deletedRows: any[];
  constructor(deletedRows: any[]) {
    this.deletedRows = deletedRows;
  }
  then(resolve: any) {
    resolve({ data: this.deletedRows, error: null });
  }
}

const extraMockProfiles = [
  { id: 'mock-user-alice-2222-3333-444444444444', name: 'Alice', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80', timezone: 'America/Los_Angeles', google_refresh_token: null, calendar_sync_enabled: false },
  { id: 'mock-user-bob-2222-3333-444444444444', name: 'Bob', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80', timezone: 'America/Los_Angeles', google_refresh_token: null, calendar_sync_enabled: false },
  { id: 'mock-user-charlie-2222-3333-444444444444', name: 'Charlie', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80', timezone: 'America/Los_Angeles', google_refresh_token: null, calendar_sync_enabled: false },
  { id: 'mock-user-david-2222-3333-444444444444', name: 'David', avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&h=256&q=80', timezone: 'America/Los_Angeles', google_refresh_token: null, calendar_sync_enabled: false },
  { id: 'mock-user-eve-2222-3333-444444444444', name: 'Eve', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80', timezone: 'America/Los_Angeles', google_refresh_token: null, calendar_sync_enabled: false },
  { id: 'mock-user-frank-2222-3333-444444444444', name: 'Frank', avatar_url: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=256&h=256&q=80', timezone: 'America/Los_Angeles', google_refresh_token: null, calendar_sync_enabled: false },
  { id: 'mock-user-grace-2222-3333-444444444444', name: 'Grace', avatar_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=256&h=256&q=80', timezone: 'America/Los_Angeles', google_refresh_token: null, calendar_sync_enabled: false },
  { id: 'mock-user-henry-2222-3333-444444444444', name: 'Henry', avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80', timezone: 'America/Los_Angeles', google_refresh_token: null, calendar_sync_enabled: false },
  { id: 'mock-user-ivy-2222-3333-444444444444', name: 'Ivy', avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80', timezone: 'America/Los_Angeles', google_refresh_token: null, calendar_sync_enabled: false },
  { id: 'mock-user-jack-2222-3333-444444444444', name: 'Jack', avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80', timezone: 'America/Los_Angeles', google_refresh_token: null, calendar_sync_enabled: false },
  { id: 'mock-user-karen-2222-3333-444444444444', name: 'Karen', avatar_url: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=256&h=256&q=80', timezone: 'America/Los_Angeles', google_refresh_token: null, calendar_sync_enabled: false }
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

class MockQueryBuilder {
  private tableName: string;
  private filters: { field: string; value: any; operator?: string }[] = [];
  private isSingle: boolean = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  private getData(): any[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(`mock_db_${this.tableName}`);
    if (!stored) {
      // Seed initial data for availability if empty to make it friendly
      if (this.tableName === 'recurring_availability') {
        const initial = [
          {
            id: 'init-1',
            user_id: mockUser.id,
            day_of_week: 1, // Monday
            start_time: '09:00:00',
            end_time: '12:00:00'
          },
          {
            id: 'init-2',
            user_id: mockUser.id,
            day_of_week: 3, // Wednesday
            start_time: '14:00:00',
            end_time: '17:00:00'
          }
        ];
        localStorage.setItem(`mock_db_${this.tableName}`, JSON.stringify(initial));
        return initial;
      }
      return [];
    }
    return JSON.parse(stored);
  }

  private saveData(data: any[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`mock_db_${this.tableName}`, JSON.stringify(data));
      if (this.tableName === 'recurring_availability') {
        document.cookie = `mock_recurring_patterns=${encodeURIComponent(JSON.stringify(data))}; path=/;`;
      }
    }
  }

  select(columns: string = '*') {
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, value });
    return this;
  }

  gte(field: string, value: any) {
    this.filters.push({ field, value, operator: 'gte' });
    return this;
  }

  lte(field: string, value: any) {
    this.filters.push({ field, value, operator: 'lte' });
    return this;
  }

  order(field: string, { ascending = true } = {}) {
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  then(resolve: any) {
    try {
      if (this.tableName === 'profiles') {
        const getCookie = (name: string) => {
          if (typeof window === 'undefined') return undefined;
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return undefined;
        };
        const profileStr = getCookie('mock_profile');
        let profile = profileStr ? JSON.parse(decodeURIComponent(profileStr)) : {
          id: mockUser.id,
          name: mockUser.raw_user_meta_data.full_name,
          avatar_url: mockUser.raw_user_meta_data.avatar_url,
          timezone: 'America/Los_Angeles',
          google_refresh_token: null,
          calendar_sync_enabled: false
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

      if (this.tableName === 'synced_busy_blocks') {
        const getCookie = (name: string) => {
          if (typeof window === 'undefined') return undefined;
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return undefined;
        };
        const busyStr = getCookie('mock_busy_blocks');
        let busyBlocks = busyStr ? JSON.parse(decodeURIComponent(busyStr)) : [];

        const filtered = busyBlocks.filter((row: any) => {
          return this.filters.every(filter => {
            if (filter.operator === 'gte') {
              return new Date(row[filter.field]) >= new Date(filter.value);
            }
            if (filter.operator === 'lte') {
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

      if (this.tableName === 'date_overrides') {
        const getCookie = (name: string) => {
          if (typeof window === 'undefined') return undefined;
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return undefined;
        };
        const overridesStr = getCookie('mock_overrides');
        let overrides = overridesStr ? JSON.parse(decodeURIComponent(overridesStr)) : [];

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

      const data = this.executeSelect();
      resolve({ 
        data: this.isSingle ? (data[0] || null) : data, 
        error: null 
      });
    } catch (err: any) {
      resolve({ data: null, error: err });
    }
  }

  private executeSelect() {
    let data = this.getData();
    if (this.tableName === 'recurring_availability') {
      data = [...data, ...extraMockPatterns];
    }
    for (const filter of this.filters) {
      data = data.filter((row: any) => row[filter.field] === filter.value);
    }
    return data;
  }

  insert(values: any | any[]) {
    if (this.tableName === 'synced_busy_blocks') {
      const getCookie = (name: string) => {
        if (typeof window === 'undefined') return undefined;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return undefined;
      };
      const busyStr = getCookie('mock_busy_blocks');
      let busyBlocks = busyStr ? JSON.parse(decodeURIComponent(busyStr)) : [];

      const rowsToInsert = Array.isArray(values) ? values : [values];
      const inserted = rowsToInsert.map(row => ({
        id: Math.random().toString(36).substring(2),
        last_synced_at: new Date().toISOString(),
        ...row
      }));
      busyBlocks.push(...inserted);

      if (typeof window !== 'undefined') {
        document.cookie = `mock_busy_blocks=${encodeURIComponent(JSON.stringify(busyBlocks))}; path=/;`;
      }
      return new MockInsertBuilder(inserted);
    }

    if (this.tableName === 'date_overrides') {
      const getCookie = (name: string) => {
        if (typeof window === 'undefined') return undefined;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return undefined;
      };
      const overridesStr = getCookie('mock_overrides');
      let overrides = overridesStr ? JSON.parse(decodeURIComponent(overridesStr)) : [];

      const rowsToInsert = Array.isArray(values) ? values : [values];
      const inserted = rowsToInsert.map(row => ({
        id: Math.random().toString(36).substring(2),
        ...row
      }));
      overrides.push(...inserted);

      if (typeof window !== 'undefined') {
        document.cookie = `mock_overrides=${encodeURIComponent(JSON.stringify(overrides))}; path=/;`;
      }
      
      const builder = new MockInsertBuilder(inserted);
      // We want select().single() mock chain support on insertion return
      (builder as any).select = () => ({
        single: () => ({
          then: (resolve: any) => resolve({ data: inserted[0], error: null })
        }),
        then: (resolve: any) => resolve({ data: inserted, error: null })
      });
      return builder;
    }

    const data = this.getData();
    const rowsToInsert = Array.isArray(values) ? values : [values];
    const insertedRows = rowsToInsert.map(row => ({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      ...row
    }));
    data.push(...insertedRows);
    this.saveData(data);
    return new MockInsertBuilder(insertedRows);
  }

  update(values: any) {
    if (this.tableName === 'profiles') {
      const getCookie = (name: string) => {
        if (typeof window === 'undefined') return undefined;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return undefined;
      };
      const profileStr = getCookie('mock_profile');
      let profile = profileStr ? JSON.parse(decodeURIComponent(profileStr)) : {
        id: mockUser.id,
        name: mockUser.raw_user_meta_data.full_name,
        avatar_url: mockUser.raw_user_meta_data.avatar_url,
        timezone: 'America/Los_Angeles',
        google_refresh_token: null,
        calendar_sync_enabled: false
      };
      const updated = { ...profile, ...values };
      if (typeof window !== 'undefined') {
        document.cookie = `mock_profile=${encodeURIComponent(JSON.stringify(updated))}; path=/;`;
      }
      return new MockUpdateBuilder([updated]);
    }

    if (this.tableName === 'date_overrides') {
      const getCookie = (name: string) => {
        if (typeof window === 'undefined') return undefined;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return undefined;
      };
      const overridesStr = getCookie('mock_overrides');
      let overrides = overridesStr ? JSON.parse(decodeURIComponent(overridesStr)) : [];
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

      if (typeof window !== 'undefined') {
        document.cookie = `mock_overrides=${encodeURIComponent(JSON.stringify(modified))}; path=/;`;
      }
      return new MockUpdateBuilder(updatedRows);
    }

    const data = this.getData();
    const updatedRows: any[] = [];
    const modifiedData = data.map(row => {
      const matches = this.filters.every(filter => row[filter.field] === filter.value);
      if (matches) {
        const updated = { ...row, ...values };
        updatedRows.push(updated);
        return updated;
      }
      return row;
    });
    this.saveData(modifiedData);
    return new MockUpdateBuilder(updatedRows);
  }

  delete() {
    if (this.tableName === 'synced_busy_blocks') {
      const getCookie = (name: string) => {
        if (typeof window === 'undefined') return undefined;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return undefined;
      };
      const busyStr = getCookie('mock_busy_blocks');
      let busyBlocks = busyStr ? JSON.parse(decodeURIComponent(busyStr)) : [];

      const remaining = busyBlocks.filter((row: any) => {
        const matches = this.filters.every(filter => {
          if (filter.operator === 'gte') {
            return new Date(row[filter.field]) >= new Date(filter.value);
          }
          if (filter.operator === 'lte') {
            return new Date(row[filter.field]) <= new Date(filter.value);
          }
          return row[filter.field] === filter.value;
        });
        return !matches;
      });

      const deletedRows = busyBlocks.filter((row: any) => {
        return this.filters.every(filter => {
          if (filter.operator === 'gte') {
            return new Date(row[filter.field]) >= new Date(filter.value);
          }
          if (filter.operator === 'lte') {
            return new Date(row[filter.field]) <= new Date(filter.value);
          }
          return row[filter.field] === filter.value;
        });
      });

      if (typeof window !== 'undefined') {
        document.cookie = `mock_busy_blocks=${encodeURIComponent(JSON.stringify(remaining))}; path=/;`;
      }
      return new MockDeleteBuilder(deletedRows);
    }

    if (this.tableName === 'date_overrides') {
      const getCookie = (name: string) => {
        if (typeof window === 'undefined') return undefined;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return undefined;
      };
      const overridesStr = getCookie('mock_overrides');
      let overrides = overridesStr ? JSON.parse(decodeURIComponent(overridesStr)) : [];

      const remaining = overrides.filter((row: any) => {
        const matches = this.filters.every(filter => row[filter.field] === filter.value);
        return !matches;
      });

      const deletedRows = overrides.filter((row: any) => {
        return this.filters.every(filter => row[filter.field] === filter.value);
      });

      if (typeof window !== 'undefined') {
        document.cookie = `mock_overrides=${encodeURIComponent(JSON.stringify(remaining))}; path=/;`;
      }
      return new MockDeleteBuilder(deletedRows);
    }

    const data = this.getData();
    const deletedRows: any[] = [];
    const remainingData = data.filter(row => {
      const matches = this.filters.every(filter => row[filter.field] === filter.value);
      if (matches) {
        deletedRows.push(row);
        return false;
      }
      return true;
    });
    this.saveData(remainingData);
    return new MockDeleteBuilder(deletedRows);
  }
}

const getCookie = (name: string) => {
  if (typeof window === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
};

const mockAuth = {
  getUser: async () => {
    const isLoggedIn = getCookie('mock_logged_in') === 'true';
    if (isLoggedIn) {
      return { data: { user: mockUser }, error: null };
    }
    return { data: { user: null }, error: { message: 'Not logged in' } };
  },
  getSession: async () => {
    const isLoggedIn = getCookie('mock_logged_in') === 'true';
    if (isLoggedIn) {
      const profileStr = getCookie('mock_profile');
      const profile = profileStr ? JSON.parse(decodeURIComponent(profileStr)) : null;
      return { 
        data: { 
          session: { 
            user: mockUser, 
            provider_refresh_token: profile?.google_refresh_token || 'mock_google_refresh_token_123' 
          } 
        }, 
        error: null 
      };
    }
    return { data: { session: null }, error: null };
  },
  signInWithOAuth: async (options: any) => {
    console.log('Mock OAuth login initialized:', options);
    const redirectTo = options?.options?.redirectTo || '/dashboard';
    const callbackUrl = `/auth/callback?code=mock_code&next=${encodeURIComponent(redirectTo)}`;
    return { data: { provider: 'google', url: callbackUrl }, error: null };
  },
  signOut: async () => {
    console.log('Mock signed out');
    if (typeof window !== 'undefined') {
      document.cookie = "mock_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      document.cookie = "mock_profile=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    }
    return { error: null };
  }
};

const mockSupabase = {
  auth: mockAuth,
  from: (tableName: string) => {
    return new MockQueryBuilder(tableName);
  }
};

export const supabase = isConfigured
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : (mockSupabase as any);

