import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user using getUser
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;
    console.log("User ID:", userId);

    // Check master role using service role client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleCheck, error: roleError } = await adminClient.rpc("has_role", {
      _user_id: userId,
      _role: "master",
    });

    console.log("Role check:", roleCheck, "Error:", roleError);

    if (!roleCheck) {
      return new Response(
        JSON.stringify({ error: "Only Master Admin can send notifications" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { title, message, url, data } = await req.json();
    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: "title and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send via OneSignal REST API
    const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID");
    const oneSignalApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");

    if (!oneSignalAppId || !oneSignalApiKey) {
      console.error("OneSignal not configured. APP_ID:", !!oneSignalAppId, "API_KEY:", !!oneSignalApiKey);
      return new Response(
        JSON.stringify({ error: "OneSignal not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notificationPayload: Record<string, unknown> = {
      app_id: oneSignalAppId,
      included_segments: ["All"],
      headings: { en: title },
      contents: { en: message },
    };

    if (url) {
      notificationPayload.url = url;
    }
    if (data) {
      notificationPayload.data = data;
    }

    console.log("Sending to OneSignal:", JSON.stringify(notificationPayload));

    const oneSignalResponse = await fetch(
      "https://onesignal.com/api/v1/notifications",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${oneSignalApiKey}`,
        },
        body: JSON.stringify(notificationPayload),
      }
    );

    const result = await oneSignalResponse.json();
    console.log("OneSignal response:", JSON.stringify(result));

    if (!oneSignalResponse.ok) {
      return new Response(
        JSON.stringify({ error: result.errors?.[0] || "Failed to send notification" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, recipients: result.recipients || 0 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
