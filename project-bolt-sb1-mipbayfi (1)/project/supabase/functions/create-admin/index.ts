import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Missing env vars" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { email, password, fullName } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "email and password required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already exists
    const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const existing = listData?.users?.find((u: { email?: string }) => u.email === email);

    if (existing) {
      // Update password and ensure admin profile
      const { error: updError } = await admin.auth.admin.updateUserById(existing.id, { password });
      if (updError) throw updError;
      await admin.from("profiles").upsert({
        id: existing.id, email, full_name: fullName ?? "RoadGuard Admin", role: "admin", is_active: true,
      });
      return new Response(JSON.stringify({ success: true, action: "updated", id: existing.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create new user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName ?? "RoadGuard Admin" },
    });
    if (authError) throw authError;

    await admin.from("profiles").upsert({
      id: authData.user.id, email, full_name: fullName ?? "RoadGuard Admin", role: "admin", is_active: true,
    });

    return new Response(JSON.stringify({ success: true, action: "created", id: authData.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
