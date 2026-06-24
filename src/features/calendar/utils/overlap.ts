import { DateOverride, SyncedBusyBlock, RecurringAvailability, Profile } from "../types";

/**
 * Helper to format double digit numbers.
 */
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Checks if a user is free in a specific 15-minute time slot.
 * 
 * Precedence rules:
 * 1. If a date_override exists for that user covering the slot, use its status.
 * 2. Else if a synced_busy_blocks row overlaps the slot, treat the user as unavailable.
 * 3. Else if the recurring_availability pattern covers the slot, treat the user as free.
 * 4. Else treat the user as unavailable.
 */
export function isUserFreeInSlot(
  userId: string,
  slotStart: Date,
  slotEnd: Date,
  overrides: DateOverride[],
  busyBlocks: SyncedBusyBlock[],
  patterns: RecurringAvailability[]
): boolean {
  // Extract date and time parts in local/system timezone for SQL Date/Time compatibility
  const slotDateStr = `${slotStart.getFullYear()}-${pad(slotStart.getMonth() + 1)}-${pad(slotStart.getDate())}`;
  const slotStartTimeStr = `${pad(slotStart.getHours())}:${pad(slotStart.getMinutes())}:00`;
  const slotEndTimeStr = `${pad(slotEnd.getHours())}:${pad(slotEnd.getMinutes())}:00`;
  const dayOfWeek = slotStart.getDay(); // 0 (Sun) to 6 (Sat)

  // 1. Check Date Overrides (Override beats Sync & Pattern)
  // Covers the slot if override matches date, and start_time <= slotStartTime, and end_time >= slotEndTime
  const override = overrides.find(o => 
    o.user_id === userId &&
    o.date === slotDateStr &&
    (o.start_time === null || o.start_time <= slotStartTimeStr) &&
    (o.end_time === null || o.end_time >= slotEndTimeStr)
  );

  if (override) {
    return override.status === "free";
  }

  // 2. Check Synced Busy Blocks (Sync beats Pattern)
  // Overlaps if block start_datetime < slotEnd and block end_datetime > slotStart
  const overlapsBusy = busyBlocks.some(block => 
    block.user_id === userId &&
    new Date(block.start_datetime) < slotEnd &&
    new Date(block.end_datetime) > slotStart
  );

  if (overlapsBusy) {
    return false;
  }

  // 3. Check Recurring Availability Pattern (Pattern beats Uncovered)
  // Covers the slot if pattern matches day of week, and start_time <= slotStartTime, and end_time >= slotEndTime
  const patternMatch = patterns.some(p => 
    p.user_id === userId &&
    p.day_of_week === dayOfWeek &&
    p.start_time <= slotStartTimeStr &&
    p.end_time >= slotEndTimeStr
  );

  if (patternMatch) {
    return true;
  }

  // 4. Uncovered slot defaults to unavailable
  return false;
}

/**
 * Computes, for every 15-minute slot in the given range, how many users are free.
 */
export function computeOverlap(
  startRange: Date,
  endRange: Date,
  profiles: Profile[],
  overrides: DateOverride[],
  busyBlocks: SyncedBusyBlock[],
  patterns: RecurringAvailability[]
) {
  const slots: { slotStart: Date; slotEnd: Date }[] = [];
  let current = new Date(startRange);
  const end = new Date(endRange);

  // Split range into 15-minute increments
  while (current < end) {
    const slotStart = new Date(current);
    const slotEnd = new Date(current.getTime() + 15 * 60 * 1000);
    
    if (slotEnd > end) {
      break;
    }
    
    slots.push({ slotStart, slotEnd });
    current = slotEnd;
  }

  // Compute status for each slot
  return slots.map(slot => {
    const freeUserIds: string[] = [];
    
    for (const profile of profiles) {
      const isFree = isUserFreeInSlot(
        profile.id,
        slot.slotStart,
        slot.slotEnd,
        overrides,
        busyBlocks,
        patterns
      );
      
      if (isFree) {
        freeUserIds.push(profile.id);
      }
    }

    return {
      slotStart: slot.slotStart.toISOString(),
      slotEnd: slot.slotEnd.toISOString(),
      freeCount: freeUserIds.length,
      freeUserIds
    };
  });
}
