import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = ["ailsa@clubchoir.ca"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    // Support both direct calls and database webhook trigger format
    const record = payload.record || payload;
    const { display_name, message, location } = record;

    if (!display_name || !message || !location) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const subject = `💬 New chat message in ${location}`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; margin-bottom: 4px;">New Chat Message</h2>
        <p style="color: #888; font-size: 14px; margin-top: 0;">Location: <strong>${location}</strong></p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="color: #333; font-weight: 600; margin: 0 0 4px 0;">${display_name}</p>
          <p style="color: #555; margin: 0; white-space: pre-wrap;">${message}</p>
        </div>
        <p style="font-size: 13px; color: #999;">
          <a href="https://clubchoir.ca/chat" style="color: #6366f1;">Open Chat</a>
        </p>
      </div>
    `;

    for (const email of ADMIN_EMAILS) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: "Club Choir <notify@notify.clubchoir.ca>",
          to: [email],
          subject,
          html: htmlBody,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-chat-message:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
