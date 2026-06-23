import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncGoogleCalendar } from "@/lib/google/sync";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: targetUserId } = await params;
  const supabase = createClient();

  // Verify the user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: No active session." },
      { status: 401 }
    );
  }

  // Ensure users can only trigger synchronization for themselves
  if (user.id !== targetUserId) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Cannot sync schedules for other accounts." },
      { status: 403 }
    );
  }

  // Execute sync
  const result = await syncGoogleCalendar(targetUserId);

  if (!result.success) {
    return NextResponse.json(
      result,
      { status: result.reconnectRequired ? 400 : 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Successfully synchronized ${result.count || 0} busy schedule intervals.`,
    count: result.count
  });
}
