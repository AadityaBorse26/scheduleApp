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

class MockQueryBuilder {
  private tableName: string;
  private filters: { field: string; value: any }[] = [];

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
    }
  }

  select(columns: string = '*') {
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, value });
    return this;
  }

  order(field: string, { ascending = true } = {}) {
    return this;
  }

  then(resolve: any) {
    try {
      const data = this.executeSelect();
      resolve({ data, error: null });
    } catch (err: any) {
      resolve({ data: null, error: err });
    }
  }

  private executeSelect() {
    let data = this.getData();
    for (const filter of this.filters) {
      data = data.filter((row: any) => row[filter.field] === filter.value);
    }
    return data;
  }

  insert(values: any | any[]) {
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

const mockAuth = {
  getUser: async () => {
    return { data: { user: mockUser }, error: null };
  },
  getSession: async () => {
    return { data: { session: { user: mockUser } }, error: null };
  },
  signInWithOAuth: async (options: any) => {
    console.log('Mock OAuth login initialized:', options);
    return { data: { provider: 'google', url: '/dashboard' }, error: null };
  },
  signOut: async () => {
    console.log('Mock signed out');
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
