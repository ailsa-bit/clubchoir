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
    if (!email) throw new Error("Email is required");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: "https://clubchoir.ca/community",
      },
    });

    if (error) throw error;

    const actionLink = data?.properties?.action_link;
    if (!actionLink) throw new Error("Failed to generate magic link");

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY is not configured");

    const resend = new Resend(resendKey);

    const emailHtml = `
      <div style="font-family: 'Nunito', 'Quicksand', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 28px; background-color: #ffffff;">
        <img src="https://vbbfpzszmtwhydhpgtgj.supabase.co/storage/v1/object/public/email-assets/club-choir-logo.png?v=1" alt="Club Choir" width="120" style="margin-bottom: 24px;" />
        <h1 style="font-size: 24px; font-weight: bold; color: hsl(240, 10%, 16%); font-family: 'Quicksand', Arial, sans-serif; margin: 0 0 20px;">Your Login Link</h1>
        <p style="font-size: 15px; color: hsl(240, 5%, 46%); line-height: 1.6; margin: 0 0 28px;">Click the button below to sign in to Club Choir. This link will expire shortly.</p>
        <div style="margin-bottom: 28px;">
          <a href="${actionLink}" style="display: inline-block; background-color: hsl(340, 75%, 60%); color: #ffffff; font-size: 15px; font-weight: 600; border-radius: 16px; padding: 14px 28px; text-decoration: none; font-family: 'Quicksand', Arial, sans-serif;">Sign In</a>
        </div>
        <div style="background-color: hsl(45, 60%, 96%); border-radius: 16px; padding: 20px 22px; margin: 0 0 28px;">
          <p style="font-size: 15px; font-weight: 700; color: hsl(240, 10%, 16%); font-family: 'Quicksand', Arial, sans-serif; margin: 0 0 12px;">How to proceed / Comment procéder</p>
          <ol style="font-size: 14px; color: hsl(240, 5%, 30%); line-height: 1.7; margin: 0; padding-left: 18px;">
            <li>Tap <strong>Sign In</strong> above — no password needed. / Cliquez sur <strong>Sign In</strong> — aucun mot de passe requis.</li>
            <li>You'll land in the members section, where you can see the songs and resources for this session. / Vous arriverez dans la section des membres, avec les chansons et les ressources de la session.</li>
            <li>To set a password for next time, go to the login page and use <strong>Forgot password?</strong>. / Pour créer un mot de passe, utilisez <strong>Mot de passe oublié?</strong> sur la page de connexion.</li>
            <li>Still stuck? Email <a href="mailto:ailsa@clubchoir.ca" style="color: hsl(340, 75%, 60%);">ailsa@clubchoir.ca</a>. / Un souci? Écrivez à <a href="mailto:ailsa@clubchoir.ca" style="color: hsl(340, 75%, 60%);">ailsa@clubchoir.ca</a>.</li>
          </ol>
        </div>

        <p style="font-size: 12px; color: hsl(240, 5%, 46%); line-height: 1.6; margin: 0 0 16px; word-break: break-all;">
          If the button above doesn't work, copy and paste this link into your browser:
          <a href="${actionLink}" style="color: hsl(340, 75%, 60%); text-decoration: underline;">${actionLink}</a>
        </p>
        <p style="font-size: 12px; color: #999999; margin: 32px 0 0;">If you didn't request this link, you can safely ignore this email.</p>
      </div>
    `;

    await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: [email],
      subject: "Your Club Choir Sign In Link",
      html: emailHtml,
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
