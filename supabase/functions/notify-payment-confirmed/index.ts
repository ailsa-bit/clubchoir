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
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
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
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { email, first_name, amount, location, has_account } = await req.json();
    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Missing or invalid email" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!resendKey) {
      return new Response(JSON.stringify({ error: "Email not configured" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if user already has an auth account
    let hasAccount = !!has_account;
    if (!hasAccount) {
      const { data: userLookup } = await adminClient.auth.admin.listUsers();
      hasAccount = !!userLookup?.users?.find(u => (u.email || "").toLowerCase() === email.toLowerCase());
    }

    const resend = new Resend(resendKey);
    const greeting = first_name ? `, ${first_name}` : "";
    const amountLine = typeof amount === "number" && amount > 0
      ? `<p style="font-size:15px; color:hsl(240,5%,30%); line-height:1.6; margin:0 0 20px;">We've received your payment of <strong>$${amount.toFixed(2)} CAD</strong>${location ? ` for the Fall 2026 session at <strong>${location}</strong>` : ""}. You're officially in!</p>`
      : `<p style="font-size:15px; color:hsl(240,5%,30%); line-height:1.6; margin:0 0 20px;">We've received your payment${location ? ` for the Fall 2026 session at <strong>${location}</strong>` : ""}. You're officially in!</p>`;

    const signInBlock = hasAccount
      ? `<div style="background:hsl(340,75%,97%); border:1px solid hsl(340,75%,90%); border-radius:12px; padding:18px 20px; margin:8px 0 28px;">
          <p style="font-family:'Quicksand',Arial,sans-serif; font-size:15px; font-weight:700; color:hsl(340,60%,35%); margin:0 0 10px;">🔑 Sign in to the members section</p>
          <p style="font-size:14px; color:hsl(240,5%,30%); line-height:1.6; margin:0 0 10px;">
            Head to <a href="${SITE_URL}/login" style="color:hsl(340,75%,60%); text-decoration:underline;">${SITE_URL}/login</a> and sign in with your email and password.
          </p>
          <p style="font-size:14px; color:hsl(240,5%,30%); line-height:1.6; margin:0;">
            Once you're in, check out <strong>Song Resources</strong> to hear the songs we'll be learning this session — with recordings, lyrics, and sheet music.
          </p>
        </div>`
      : `<div style="background:hsl(340,75%,97%); border:1px solid hsl(340,75%,90%); border-radius:12px; padding:18px 20px; margin:8px 0 28px;">
          <p style="font-family:'Quicksand',Arial,sans-serif; font-size:15px; font-weight:700; color:hsl(340,60%,35%); margin:0 0 10px;">🔑 Create your members account</p>
          <p style="font-size:14px; color:hsl(240,5%,30%); line-height:1.6; margin:0 0 10px;">
            To see the songs we'll be learning this session, create your free members account at
            <a href="${SITE_URL}/login" style="color:hsl(340,75%,60%); text-decoration:underline;">${SITE_URL}/login</a> using this email address (<strong>${email}</strong>). Access unlocks automatically.
          </p>
          <p style="font-size:14px; color:hsl(240,5%,30%); line-height:1.6; margin:0;">
            Once signed in, head to <strong>Song Resources</strong> for recordings, lyrics, and sheet music.
          </p>
        </div>`;

    const html = `
<div style="font-family: 'Nunito', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 28px; background:#ffffff;">
  <img src="https://vbbfpzszmtwhydhpgtgj.supabase.co/storage/v1/object/public/email-assets/club-choir-logo.png?v=1" alt="Club Choir" width="120" style="margin-bottom:24px" />
  <h1 style="font-family:'Quicksand',Arial,sans-serif; font-size:26px; color:hsl(240,10%,16%); margin:0 0 20px;">
    🎉 Payment confirmed${greeting}!
  </h1>
  ${amountLine}
  <p style="font-size:15px; color:hsl(240,5%,30%); line-height:1.6; margin:0 0 20px;">
    Your Club Choir membership is active through <strong>December 10, 2026</strong>.
  </p>
  ${signInBlock}
  <p style="font-size:15px; color:hsl(240,5%,30%); line-height:1.6; margin:0 0 20px;">
    Questions? Just reply to this email or reach us at
    <a href="mailto:ailsa@clubchoir.ca" style="color:hsl(340,75%,60%); text-decoration:underline;">ailsa@clubchoir.ca</a>.
  </p>
  <p style="font-size:15px; color:hsl(240,5%,30%); line-height:1.6; margin:0 0 20px;">
    Can't wait to sing with you!<br />
    — The Club Choir Team
  </p>
  <hr style="border:none; border-top:1px solid #eee; margin:24px 0 12px;" />
  <p style="font-size:12px; color:#999; text-align:center; margin:0;">Club Choir · ${SITE_URL}</p>
</div>`;

    await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: [email],
      subject: "🎉 Payment confirmed — welcome to Club Choir!",
      html,
    });

    return new Response(JSON.stringify({ success: true, hasAccount }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-payment-confirmed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
