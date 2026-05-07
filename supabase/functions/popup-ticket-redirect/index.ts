import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const APP_URL = "https://clubchoir.ca";

const html = (body: string, status = 200) =>
  new Response(
    `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Club Choir Ticket</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Nunito',sans-serif;background:#fafafa;color:#222;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center}.card{max-width:440px;background:#fff;border-radius:16px;padding:32px;box-shadow:0 4px 20px rgba(0,0,0,.06)}h1{font-family:'Quicksand',sans-serif;margin:0 0 12px;font-size:22px}p{margin:8px 0;line-height:1.5;color:#555}a.btn{display:inline-block;margin-top:16px;background:#f97316;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600}</style></head><body><div class="card">${body}</div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );

serve(async (req) => {
  try {
    const url = new URL(req.url);
    // Token can come from ?t=xxx or as the last path segment
    const t = url.searchParams.get("t") || url.pathname.split("/").filter(Boolean).pop() || "";
    const token = t.trim();

    if (!token || token.length < 8 || token === "popup-ticket-redirect") {
      return html(
        `<h1>🎟️ Ticket link missing</h1><p>This link doesn't include a ticket code. Please open the QR code directly from your confirmation email.</p>`,
        400,
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: r } = await supabase
      .from("popup_ticket_reservations")
      .select("id, first_name, last_name, ticket_count, payment_received, checked_in_at, event_slug")
      .eq("ticket_token", token)
      .maybeSingle();

    if (!r) {
      return html(
        `<h1>Ticket not found</h1><p>This ticket may have been cancelled. Please contact <a href="mailto:ailsa@clubchoir.ca">ailsa@clubchoir.ca</a> for help.</p>`,
        404,
      );
    }

    // Friendly landing page with deep-link to the admin check-in screen.
    const target = `${APP_URL}/checkin/${encodeURIComponent(token)}`;
    return html(
      `<h1>🎟️ Ticket valid</h1>
       <p><strong>${escapeHtml(r.first_name)} ${escapeHtml(r.last_name)}</strong><br/>
       ${r.ticket_count} ticket${r.ticket_count > 1 ? "s" : ""} · ${r.payment_received ? "Paid ✅" : "Unpaid ⚠️"}${r.checked_in_at ? " · Already checked in" : ""}</p>
       <p>Show this screen at the door, or tap below if you're an organizer.</p>
       <a class="btn" href="${target}">Open check-in</a>`,
      200,
    );
  } catch (e) {
    console.error("redirect error", e);
    return html(`<h1>Something went wrong</h1><p>Please try again or contact ailsa@clubchoir.ca.</p>`, 500);
  }
});

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
