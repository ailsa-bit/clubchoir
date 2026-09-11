import { emailButton } from "../_shared/email-button.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
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
    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { user_id, action, email } = await req.json();

    if (action === "invite") {
      if (!email) {
        return new Response(JSON.stringify({ error: "email required for invite" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email);
      if (inviteError) throw inviteError;

      return new Response(JSON.stringify({ success: true, message: "Invitation sent" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let targetUserId = user_id as string | undefined;

    // Allow lookup by email when no user_id is supplied
    if (!targetUserId && email) {
      const { data: list, error: listError } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (listError) throw listError;
      const match = list?.users?.find(
        (u: any) => (u.email ?? "").toLowerCase() === String(email).toLowerCase(),
      );
      if (!match) {
        return new Response(JSON.stringify({ error: "User not found for that email" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      targetUserId = match.id;
    }

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "user_id or email required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (action === "resend") {
      // Get user email first
      const { data: { user: targetUser }, error: getUserError } = await adminClient.auth.admin.getUserById(targetUserId);
      if (getUserError || !targetUser) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: "signup",
        email: targetUser.email!,
        options: { redirectTo: "https://clubchoir.ca/this-week" },
      });

      if (linkError) throw linkError;

      const actionLink = linkData?.properties?.action_link ?? "";
      if (!actionLink) throw new Error("Could not generate confirmation link");

      // Actually deliver the new link — generateLink alone only creates it
      // (and invalidates the previously emailed one).
      const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
      const { error: sendError } = await resend.emails.send({
        from: "Club Choir <noreply@clubchoir.ca>",
        to: [targetUser.email!],
        subject: "Confirm your Club Choir email / Confirmez votre courriel",
        html: `
          <div style="font-family: 'Nunito', 'Quicksand', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 28px; background-color: #ffffff;">
            <img src="https://vbbfpzszmtwhydhpgtgj.supabase.co/storage/v1/object/public/email-assets/club-choir-logo.png?v=1" alt="Club Choir" width="120" style="margin-bottom: 24px;" />
            <h1 style="font-size: 24px; font-weight: bold; color: hsl(240, 10%, 16%); font-family: 'Quicksand', Arial, sans-serif; margin: 0 0 20px;">Confirm your email</h1>
            <p style="font-size: 15px; color: hsl(240, 5%, 30%); line-height: 1.7; margin: 0 0 24px;">
              One quick click and your Club Choir account is ready to go — you'll get access to the weekly schedule, recordings, lyrics and slides.
              <br /><br />
              Un simple clic et votre compte Club Choir est prêt — vous aurez accès à l'horaire hebdomadaire, aux enregistrements, aux paroles et aux diapositives.
            </p>
            <div style="margin-bottom: 28px;">
              ${emailButton(actionLink, "Confirm my email / Confirmer mon courriel")}
            </div>
            <p style="font-size: 12px; color: hsl(240, 5%, 46%); line-height: 1.6; margin: 0 0 16px; word-break: break-all;">
              If the button doesn't work, copy and paste this link into your browser:
              <a href="${actionLink}" style="color: hsl(340, 75%, 60%); text-decoration: underline;">${actionLink}</a>
            </p>
            <p style="font-size: 14px; color: hsl(240, 5%, 46%); line-height: 1.6; margin: 0 0 20px;">
              Trouble? Email <a href="mailto:ailsa@clubchoir.ca" style="color: hsl(340, 75%, 60%);">ailsa@clubchoir.ca</a>. / Un souci? Écrivez à <a href="mailto:ailsa@clubchoir.ca" style="color: hsl(340, 75%, 60%);">ailsa@clubchoir.ca</a>.
            </p>
            <p style="font-size: 12px; color: #999999; margin: 24px 0 0;">Tra-la-la, Ailsa</p>
          </div>
        `,
      });

      if (sendError) {
        return new Response(JSON.stringify({ error: sendError.message }), {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({ success: true, message: "Confirmation email resent" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Default action: confirm email immediately
    const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUserId, {
      email_confirm: true,
    });

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in confirm-user-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
