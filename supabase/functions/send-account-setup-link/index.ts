import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NEVER_EMAIL = ["testmember@clubchoir.ca"];

const emailHtml = (actionLink: string, isNew: boolean) => `
  <div style="font-family: 'Nunito', 'Quicksand', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 28px; background-color: #ffffff;">
    <img src="https://vbbfpzszmtwhydhpgtgj.supabase.co/storage/v1/object/public/email-assets/club-choir-logo.png?v=1" alt="Club Choir" width="120" style="margin-bottom: 24px;" />
    <h1 style="font-size: 24px; font-weight: bold; color: hsl(240, 10%, 16%); font-family: 'Quicksand', Arial, sans-serif; margin: 0 0 20px;">Set up your Club Choir account</h1>
    <div style="background-color: hsl(45, 60%, 96%); border-radius: 16px; padding: 18px 20px; margin: 0 0 24px;">
      <p style="font-size: 15px; color: hsl(240, 5%, 30%); line-height: 1.7; margin: 0 0 10px;">
        It looks like you haven't created your member account yet. <strong>If you already have an account, please ignore this message.</strong>
      </p>
      <p style="font-size: 15px; color: hsl(240, 5%, 30%); line-height: 1.7; margin: 0;">
        Il semble que vous n'avez pas encore créé votre compte membre. <strong>Si vous avez déjà un compte, veuillez ignorer ce message.</strong>
      </p>
    </div>
    <p style="font-size: 15px; color: hsl(240, 5%, 46%); line-height: 1.6; margin: 0 0 24px;">
      Your spot is paid and confirmed. Click below to ${isNew ? "create your password" : "set a new password"} and get into the members section, where you'll find the weekly schedule, recordings, lyrics and slides.
      <br /><br />
      Votre place est payée et confirmée. Cliquez ci-dessous pour ${isNew ? "créer votre mot de passe" : "choisir un nouveau mot de passe"} et accéder à la section des membres (horaire, enregistrements, paroles et diapositives).
    </p>
    <div style="margin-bottom: 28px;">
      <a href="${actionLink}" style="display: inline-block; background-color: hsl(340, 75%, 60%); color: #ffffff; font-size: 15px; font-weight: 600; border-radius: 16px; padding: 14px 28px; text-decoration: none; font-family: 'Quicksand', Arial, sans-serif;">Set up my account / Créer mon compte</a>
    </div>
    <p style="font-size: 14px; color: hsl(240, 5%, 46%); line-height: 1.6; margin: 0 0 20px;">
      Trouble getting in? Email <a href="mailto:ailsa@clubchoir.ca" style="color: hsl(340, 75%, 60%);">ailsa@clubchoir.ca</a>. / Un souci? Écrivez à <a href="mailto:ailsa@clubchoir.ca" style="color: hsl(340, 75%, 60%);">ailsa@clubchoir.ca</a>.
    </p>
    <p style="font-size: 12px; color: hsl(240, 5%, 46%); line-height: 1.6; margin: 0 0 16px; word-break: break-all;">
      If the button doesn't work, copy and paste this link into your browser:
      <a href="${actionLink}" style="color: hsl(340, 75%, 60%); text-decoration: underline;">${actionLink}</a>
    </p>
    <p style="font-size: 12px; color: #999999; margin: 24px 0 0;">Tra-la-la, Ailsa</p>
  </div>
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const emails: string[] = Array.isArray(body?.emails) ? body.emails : [];
    const dryRun = body?.dry_run === true;

    const clean = Array.from(
      new Set(
        emails
          .map((e) => String(e || "").trim().toLowerCase())
          .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))
          .filter((e) => !NEVER_EMAIL.includes(e)),
      ),
    );

    if (clean.length === 0) return json({ error: "No valid recipients" }, 400);
    if (dryRun) return json({ dry_run: true, count: clean.length, recipients: clean });

    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
    const results: { email: string; ok: boolean; kind?: string; error?: string }[] = [];

    for (const email of clean) {
      try {
        let kind: "invite" | "recovery" = "recovery";
        let link = "";

        const { data: inviteData, error: inviteError } = await adminClient.auth.admin.generateLink({
          type: "invite",
          email,
          options: { redirectTo: "https://clubchoir.ca/reset-password" },
        });

        if (!inviteError && inviteData?.properties?.action_link) {
          kind = "invite";
          link = inviteData.properties.action_link;
        } else {
          const { data: recData, error: recError } = await adminClient.auth.admin.generateLink({
            type: "recovery",
            email,
            options: { redirectTo: "https://clubchoir.ca/reset-password" },
          });
          if (recError) throw recError;
          link = recData?.properties?.action_link ?? "";
        }

        if (!link) throw new Error("Could not generate link");

        await resend.emails.send({
          from: "Club Choir <noreply@clubchoir.ca>",
          to: [email],
          subject: "Set up your Club Choir account / Créez votre compte Club Choir",
          html: emailHtml(link, kind === "invite"),
        });

        results.push({ email, ok: true, kind });
      } catch (e) {
        results.push({ email, ok: false, error: (e as Error).message });
      }
    }

    return json({
      success: true,
      sent: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    });
  } catch (error) {
    return json({ error: (error as Error).message }, 400);
  }
});
