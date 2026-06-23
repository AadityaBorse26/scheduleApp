import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveGoogleRefreshToken } from "@/app/auth/actions";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Default redirect path after sign in
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    
    // Exchange the authorization code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.session) {
      const providerRefreshToken = data.session.provider_refresh_token;
      
      // If we got a refresh token from the identity provider, persist it in the database
      if (providerRefreshToken) {
        await saveGoogleRefreshToken(providerRefreshToken);
      }
    } else if (error) {
      console.error("Error during code exchange:", error.message);
    }
  }

  // Redirect to the dashboard or requested next page
  return NextResponse.redirect(new URL(next, origin));
}
