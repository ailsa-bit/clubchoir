import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import QRCode from "npm:qrcode@1.5.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { reservation_id, to } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response("Forbidden", { status: 403, headers: corsHeaders });

    const { data: r } = await supabase.from("popup_ticket_reservations").select("*").eq("id", reservation_id).maybeSingle();
    if (!r) return new Response("Not found", { status: 404, headers: corsHeaders });

    let ticketToken = r.ticket_token;
    if (!ticketToken) {
      ticketToken = crypto.randomUUID();
      await supabase.from("popup_ticket_reservations").update({ ticket_token: ticketToken }).eq("id", r.id);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const checkinUrl = `${supabaseUrl}/functions/v1/popup-ticket-redirect/${ticketToken}`;
    const qrDataUrl = await QRCode.toDataURL(checkinUrl, { width: 400, margin: 2 });
    const base64 = qrDataUrl.split(",")[1];

    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
    await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: [to],
      subject: `QR ticket for ${r.first_name} ${r.last_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2>Ticket QR for ${r.first_name} ${r.last_name}</h2>
          <p>Email: ${r.email}<br/>Tickets: ${r.ticket_count}<br/>Event: ${r.event_slug}</p>
          <p>QR code (also attached):</p>
          <img src="${qrDataUrl}" alt="QR" style="width:280px;height:280px;border:1px solid #eee;padding:8px;background:#fff;" />
          <p style="font-size:12px;color:#666;word-break:break-all;">Link: <a href="${checkinUrl}">${checkinUrl}</a></p>
        </div>
      `,
      attachments: [{ filename: `ticket-${r.first_name}-${r.last_name}.png`, content: base64 }],
    });

    return new Response(JSON.stringify({ success: true, checkinUrl }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
