# FriendScheduler 🗓️

FriendScheduler is a modern, premium Next.js scheduling application that makes finding common free times with your friends stress-free. It overlays recurring availabilities, checks real-time calendar conflicts via Google Calendar API, and offers group-wide scheduling spaces without sharing private event titles.

---

## Tech Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database & Auth**: [Supabase](https://supabase.com/) (SSR integration)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Calendars**: [FullCalendar](https://fullcalendar.io/) (with TimeGrid and Interaction extensions)
- **Libraries**: `date-fns`, `date-fns-tz`

---

## Architecture: Dual Mode execution

To streamline local development, prototyping, and user evaluation, FriendScheduler features a **Dual Mode execution** architecture:

1. **Production / Integrated Mode**:
   - Leverages **Supabase Auth** (via Google OAuth) and **Supabase Database** tables.
   - Syncs Google Calendar read-only events directly to the database via API endpoints and decrypts offline refresh tokens using a secure encryption key.
2. **Demo / Mock Mode**:
   - Activates automatically if Supabase environment variables are missing, OR if the client has the `mock_logged_in=true` cookie set.
   - Database operations (selects, updates, deletions) redirect to `localStorage` (client-side) and mock cookie stores (server-side).
   - Mock users (Alice, Bob, Charlie, etc.) are seeded automatically to showcase calendar overlay features immediately.

This behavior is driven by **Dynamic Client Proxies** defined in:
- Client-side: [lib/supabase/client.ts](file:///c:/Users/borse/OneDrive/Documents/scheduleApp/lib/supabase/client.ts)
- Server-side: [lib/supabase/server.ts](file:///c:/Users/borse/OneDrive/Documents/scheduleApp/lib/supabase/server.ts)
- Middleware routing: [middleware.ts](file:///c:/Users/borse/OneDrive/Documents/scheduleApp/middleware.ts)

---

## Setup & Installation

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Environment Variables Configuration
Create a `.env.local` file in the root directory. Below is the reference template:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google OAuth Credentials (for Calendar Sync)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Encryption Key (Must be 32-byte hex for secure token storage)
TOKEN_ENCRYPTION_KEY=your-32-byte-hex-encryption-key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## Database Schema (Supabase)

If setting up the database manually, ensure the following tables are created:

1. **`profiles`**:
   - `id`: `uuid` (primary key, references `auth.users.id`)
   - `name`: `text`
   - `avatar_url`: `text`
   - `timezone`: `text` (defaults to UTC)
   - `google_refresh_token`: `text` (encrypted, nullable)
   - `calendar_sync_enabled`: `boolean` (defaults to false)
   - `last_synced_at`: `timestamptz`

2. **`recurring_availability`**:
   - `id`: `uuid` (primary key)
   - `user_id`: `uuid` (references `auth.users.id`)
   - `day_of_week`: `int2` (0 = Sunday, 6 = Saturday)
   - `start_time`: `time`
   - `end_time`: `time`

3. **`date_overrides`**:
   - `id`: `uuid` (primary key)
   - `user_id`: `uuid` (references `auth.users.id`)
   - `date`: `date` (e.g. `2026-06-24`)
   - `type`: `text` ('busy' or 'free')
   - `start_time`: `time` (nullable)
   - `end_time`: `time` (nullable)

4. **`synced_busy_blocks`**:
   - `id`: `uuid` (primary key)
   - `user_id`: `uuid` (references `auth.users.id`)
   - `start_time`: `timestamptz`
   - `end_time`: `timestamptz`
   - `source`: `text` (e.g. 'google')
   - `last_synced_at`: `timestamptz`

---

## App Walkthrough & Capabilities

- **Portal Landing Page (`/`)**: A clean landing page offering secure single-click sign-in via Google OAuth, or guest login to explore the app with populated mock accounts.
- **Dashboard (`/dashboard`)**: The coordinator center. View your upcoming unified schedule, look up current sync statuses, and review quick next-meeting availability slots.
- **Availability (`/availability`)**: Manage weekly routines and single-day custom overrides:
  - Drag and draw recurring slots using the interactive grid.
  - Set custom overrides (e.g., mark a normally free Wednesday as fully "Busy" or set specific custom times).
- **Group Space (`/group`)**: Create coordinate rooms where you select members to overlay schedules. An intersection engine runs to overlay availability patterns, subtracting busy events, showing exactly when everyone is free to meet.

---

## Developer Guide: How to Extend

### Extending the Overlap Algorithm
The overlap and free-time search calculations are handled inside [app/api/overlap/route.ts](file:///c:/Users/borse/OneDrive/Documents/scheduleApp/app/api/overlap/route.ts). If you want to customize search limits, minimum meeting duration constraints, or introduce timezone conversions, this route is the entry point.

### Customizing Mock Data
If working in mock/offline mode, you can customize the mock users, profile details, and recurring calendars by modifying [lib/supabase/client.ts](file:///c:/Users/borse/OneDrive/Documents/scheduleApp/lib/supabase/client.ts) (for frontend mock) and [lib/supabase/server.ts](file:///c:/Users/borse/OneDrive/Documents/scheduleApp/lib/supabase/server.ts) (for backend rendering).
