import { isUserFreeInSlot } from "./overlap";

/**
 * Very basic assertion helper.
 */
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILURE: ${message}`);
    process.exit(1);
  }
}

function runTests() {
  console.log("🏃 Running scheduling precedence unit tests...");

  const userId = "test-user-9999";
  
  // Slot range: 2026-06-24 (Wednesday) from 09:00:00 to 09:15:00
  const slotStart = new Date("2026-06-24T09:00:00");
  const slotEnd = new Date("2026-06-24T09:15:00");

  // Mock database entries
  const mockPattern = [
    {
      id: "pat-1",
      user_id: userId,
      day_of_week: 3, // Wednesday
      start_time: "08:00:00",
      end_time: "12:00:00", // Covers the 09:00-09:15 slot
    }
  ];

  const mockBusyBlock = [
    {
      id: "busy-1",
      user_id: userId,
      start_datetime: "2026-06-24T08:30:00",
      end_datetime: "2026-06-24T09:30:00", // Overlaps the 09:00-09:15 slot
      source: "google"
    }
  ];

  const mockOverrideFree = [
    {
      id: "over-1",
      user_id: userId,
      date: "2026-06-24",
      start_time: "08:45:00",
      end_time: "09:30:00", // Covers the slot
      status: "free" as const
    }
  ];

  const mockOverrideUnavailable = [
    {
      id: "over-2",
      user_id: userId,
      date: "2026-06-24",
      start_time: "08:45:00",
      end_time: "09:30:00", // Covers the slot
      status: "unavailable" as const
    }
  ];

  // Test 1: Uncovered defaults to unavailable
  const t1 = isUserFreeInSlot(userId, slotStart, slotEnd, [], [], []);
  assert(t1 === false, "Test 1 Failed: Uncovered slot must default to unavailable.");
  console.log("  ✔ Test 1 Passed: Uncovered defaults to unavailable.");

  // Test 2: Recurring pattern covers the slot
  const t2 = isUserFreeInSlot(userId, slotStart, slotEnd, [], [], mockPattern);
  assert(t2 === true, "Test 2 Failed: Slot covered by recurring pattern should be available.");
  console.log("  ✔ Test 2 Passed: Recurring pattern marks slot as available.");

  // Test 3: Synced busy block overlaps the slot (Sync beats Pattern)
  const t3 = isUserFreeInSlot(userId, slotStart, slotEnd, [], mockBusyBlock, mockPattern);
  assert(t3 === false, "Test 3 Failed: Synced busy block must override recurring pattern and mark user as busy.");
  console.log("  ✔ Test 3 Passed: Synced busy block overrides recurring pattern.");

  // Test 4: Free override covers the slot (Override beats Sync)
  const t4 = isUserFreeInSlot(userId, slotStart, slotEnd, mockOverrideFree, mockBusyBlock, mockPattern);
  assert(t4 === true, "Test 4 Failed: Free date override must override synced busy blocks and mark user as free.");
  console.log("  ✔ Test 4 Passed: Free override blocks busy Google sync blocks.");

  // Test 5: Unavailable override covers the slot (Override beats Pattern)
  const t5 = isUserFreeInSlot(userId, slotStart, slotEnd, mockOverrideUnavailable, [], mockPattern);
  assert(t5 === false, "Test 5 Failed: Unavailable override must override recurring pattern and mark user as busy.");
  console.log("  ✔ Test 5 Passed: Unavailable override blocks recurring pattern blocks.");

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
}

runTests();
