import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_URL = "https://clubchoir.ca";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    // Verify caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { user_id, display_name } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Look up user's email
    const { data: userData, error: userErr } = await adminClient.auth.admin.getUserById(user_id);
    if (userErr || !userData?.user?.email) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const recipient = userData.user.email;
    const name = display_name || userData.user.user_metadata?.display_name || "";

    if (!resendKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resend = new Resend(resendKey);

    const html = `
<div style="font-family: 'Nunito', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 28px; background:#ffffff;">
  <img src="https://vbbfpzszmtwhydhpgtgj.supabase.co/storage/v1/object/public/email-assets/club-choir-logo.png?v=1" alt="Club Choir" width="120" style="margin-bottom:24px" />
  <h1 style="font-family:'Quicksand',Arial,sans-serif; font-size:26px; color:hsl(240,10%,16%); margin:0 0 20px;">
    🎉 You're in${name ? `, ${name}` : ""}!
  </h1>
  <p style="font-size:15px; color:hsl(240,5%,30%); line-height:1.6; margin:0 0 20px;">
    Great news — your Club Choir account has been approved and is now <strong>active</strong>.
    You have full access to all member resources on the website.
  </p>

  <div style="background:hsl(200,50%,97%); border:1px solid hsl(200,50%,90%); border-radius:12px; padding:18px 20px; margin:8px 0 28px;">
    <p style="font-family:'Quicksand',Arial,sans-serif; font-size:15px; font-weight:700; color:hsl(200,60%,30%); margin:0 0 10px;">
      🎵 What you can now access
    </p>
    <p style="font-size:14px; color:hsl(240,5%,30%); line-height:1.6; margin:0 0 10px;">
      Head to <a href="${SITE_URL}" style="color:hsl(340,75%,60%); text-decoration:underline;">${SITE_URL}</a>, sign in, and explore:
    </p>
    <p style="font-size:14px; color:hsl(240,5%,30%); line-height:1.6; margin:0 0 10px;">
      • <strong>Choir Community</strong> — meet fellow members in our directory.<br />
      • <strong>Locations &amp; Calendars</strong> — find your session schedule and upcoming events.<br />
      • <strong>Song Resources</strong> — listen to recordings, view lyrics, and download sheet music.<br />
      • <strong>Location Chat</strong> — stay connected with your group between sessions.<br />
      • <strong>This Week</strong> — see what's happening at your location right now.
    </p>
    <p style="font-size:14px; color:hsl(240,5%,30%); line-height:1.6; margin:0;">
      Use the menu at the top of the site to navigate between sections — everything works great on your phone too.
    </p>
  </div>

  <div style="background:hsl(340,75%,97%); border:1px solid hsl(340,75%,90%); border-radius:12px; padding:18px 20px; margin:8px 0 28px;">
    <p style="font-family:'Quicksand',Arial,sans-serif; font-size:15px; font-weight:700; color:hsl(340,60%,35%); margin:0 0 10px;">
      🔑 Signing in
    </p>
    <p style="font-size:14px; color:hsl(240,5%,30%); line-height:1.6; margin:0;">
      Just go to <a href="${SITE_URL}/login" style="color:hsl(340,75%,60%); text-decoration:underline;">${SITE_URL}/login</a>
      and sign in with the email and password you used to register.
      Forgot your password? Use the "Forgot password?" link on the sign-in page.
    </p>
  </div>

  <p style="font-size:15px; color:hsl(240,5%,30%); line-height:1.6; margin:0 0 20px;">
    Have questions or need a hand getting started? We're always here for you — just reach out anytime at
    <a href="mailto:ailsa@clubchoir.ca" style="color:hsl(340,75%,60%); text-decoration:underline;">ailsa@clubchoir.ca</a>.
  </p>

  <p style="font-size:15px; color:hsl(240,5%,30%); line-height:1.6; margin:0 0 20px;">
    Can't wait to sing with you!<br />
    — The Club Choir Team
  </p>

  <hr style="border:none; border-top:1px solid #eee; margin:24px 0 12px;" />
  <p style="font-size:12px; color:#999; text-align:center; margin:0;">Club Choir · ${SITE_URL}</p>
</div>
    `;

    await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: [recipient],
      subject: "🎉 Your Club Choir account is now active!",
      html,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-member-activated:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
