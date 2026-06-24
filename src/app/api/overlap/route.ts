import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeOverlap } from "@/features/calendar/utils/overlap";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  if (!startParam || !endParam) {
    return NextResponse.json(
      { success: false, error: "Missing required parameters: 'start' and 'end' must be provided." },
      { status: 400 }
    );
  }

  const startRange = new Date(startParam);
  const endRange = new Date(endParam);

  if (isNaN(startRange.getTime()) || isNaN(endRange.getTime())) {
    return NextResponse.json(
      { success: false, error: "Invalid date format for 'start' or 'end' parameter." },
      { status: 400 }
    );
  }

  if (startRange >= endRange) {
    return NextResponse.json(
      { success: false, error: "Parameter 'start' must be strictly before 'end'." },
      { status: 400 }
    );
  }

  const supabase = createClient();

  // Protect the API: Ensure user is signed in
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: No active session." },
      { status: 401 }
    );
  }

  try {
    // Fetch all profiles, synced busy blocks, overrides, and weekly patterns
    const [
      { data: profiles, error: errProf },
      { data: overrides, error: errOver },
      { data: busyBlocks, error: errBusy },
      { data: patterns, error: errPat }
    ] = await Promise.all([
      supabase.from("profiles").select("id, name"),
      supabase.from("date_overrides").select("*"),
      supabase.from("synced_busy_blocks").select("*"),
      supabase.from("recurring_availability").select("*")
    ]);

    if (errProf || errOver || errBusy || errPat) {
      console.error("Database fetch error during overlap query:", { errProf, errOver, errBusy, errPat });
      return NextResponse.json(
        { success: false, error: "Database retrieval failed." },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json([]);
    }

    // Compute overlapping availability
    const slots = computeOverlap(
      startRange,
      endRange,
      profiles,
      overrides || [],
      busyBlocks || [],
      patterns || []
    );

    return NextResponse.json(slots);
  } catch (err) {
    console.error("Overlap calculation failed:", err);
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
