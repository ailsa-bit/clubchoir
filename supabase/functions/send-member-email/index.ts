import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  recipients: string[];
  subject: string;
  body: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Admin access required");

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY is not configured");

    const resend = new Resend(resendKey);
    const { recipients, subject, body }: EmailRequest = await req.json();

    if (!recipients?.length || !subject || !body) {
      throw new Error("Missing required fields: recipients, subject, body");
    }

    if (recipients.length > 150) {
      throw new Error("Maximum 150 recipients per send");
    }

    // Skip anyone who already received an email with this exact subject in the last 3 days
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const since = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
    const { data: prior } = await admin
      .from("resend_email_events")
      .select("recipient_email")
      .eq("subject", subject)
      .in("event_type", ["email.sent", "email.delivered"])
      .gte("received_at", since);
    const already = new Set((prior ?? []).map((r: any) => String(r.recipient_email || "").toLowerCase()));

    const results: { success: string[]; failed: string[]; skipped: string[] } = { success: [], failed: [], skipped: [] };
    const unique = [...new Set(recipients.map((r) => r.trim().toLowerCase()))];
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Send one at a time, respecting the email provider's rate limit, and check every result
    for (const to of unique) {
      if (already.has(to)) { results.skipped.push(to); continue; }
      let ok = false;
      for (let attempt = 0; attempt < 4 && !ok; attempt++) {
        try {
          const { error } = await resend.emails.send({
            from: "Club Choir <noreply@clubchoir.ca>",
            to: [to],
            subject,
            html: `
              <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="color: #333; font-size: 24px; margin: 0;">Club Choir</h1>
                </div>
                <div style="color: #333; font-size: 16px; line-height: 1.6;">
                  ${body}
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
                <p style="color: #999; font-size: 12px; text-align: center;">
                  You're receiving this because you're part of the Club Choir community.
                </p>
              </div>
            `,
          });
          if (error) {
            console.error(`Send to ${to} failed (attempt ${attempt + 1}):`, JSON.stringify(error));
            await sleep(1500 * (attempt + 1));
          } else ok = true;
        } catch (e) {
          console.error(`Send to ${to} threw:`, e);
          await sleep(1500 * (attempt + 1));
        }
      }
      (ok ? results.success : results.failed).push(to);
      await sleep(600);
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-member-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
