import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate a recovery link using the admin API
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: "https://clubchoir.ca/reset-password",
      },
    });

    if (error) throw error;

    const actionLink = data?.properties?.action_link;
    if (!actionLink) throw new Error("Failed to generate recovery link");

    // Send the email via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY is not configured");

    const resend = new Resend(resendKey);

    await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: [email],
      subject: "Reset Your Club Choir Password",
      html: `
        <div style="font-family: 'Nunito', 'Quicksand', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 28px; background-color: #ffffff;">
          <img
            src="https://vbbfpzszmtwhydhpgtgj.supabase.co/storage/v1/object/public/email-assets/club-choir-logo.png?v=1"
            alt="Club Choir"
            width="120"
            style="margin-bottom: 24px;"
          />
          <h1 style="font-size: 24px; font-weight: bold; color: hsl(240, 10%, 16%); font-family: 'Quicksand', Arial, sans-serif; margin: 0 0 20px;">
            Reset Your Password
          </h1>
          <p style="font-size: 15px; color: hsl(240, 5%, 46%); line-height: 1.6; margin: 0 0 12px;">
            We sincerely apologize for the inconvenience you've experienced. We've resolved the issue and you should now be able to reset your password without any problems.
          </p>
          <p style="font-size: 15px; color: hsl(240, 5%, 46%); line-height: 1.6; margin: 0 0 28px;">
            Click the button below to choose a new password:
          </p>
          <div style="margin-bottom: 28px;">
            <a href="${actionLink}" style="display: inline-block; background-color: hsl(340, 75%, 60%); color: #ffffff; font-size: 15px; font-weight: 600; border-radius: 16px; padding: 14px 28px; text-decoration: none; font-family: 'Quicksand', Arial, sans-serif;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 12px; color: hsl(240, 5%, 46%); line-height: 1.6; margin: 0 0 16px; word-break: break-all;">
            If the button above doesn't work, copy and paste this link into your browser:
            <a href="${actionLink}" style="color: hsl(340, 75%, 60%); text-decoration: underline;">${actionLink}</a>
          </p>
          <p style="font-size: 12px; color: #999999; margin: 32px 0 0;">
            Thank you for your patience! If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
