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

    if (recipients.length > 100) {
      throw new Error("Maximum 100 recipients per batch");
    }

    // Send emails in batches of 10 to avoid rate limits
    const results: { success: string[]; failed: string[] } = { success: [], failed: [] };
    const batchSize = 10;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const promises = batch.map(async (to) => {
        try {
          await resend.emails.send({
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
          results.success.push(to);
        } catch {
          results.failed.push(to);
        }
      });
      await Promise.all(promises);
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
