import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ConfirmationRequest {
  contactName: string;
  email: string;
  companyName: string;
  answers: Record<string, string | string[]>;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

const formatVal = (v: string | string[]) => {
  const text = Array.isArray(v) ? (v.length ? v.join(", ") : "—") : (v && v.trim() ? v : "—");
  return escapeHtml(text);
};

const SECTIONS: { title: string; fields: { key: string; label: string }[] }[] = [
  {
    title: "Basic Information",
    fields: [
      { key: "companyName", label: "Company name" },
      { key: "contactName", label: "Contact name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone number" },
    ],
  },
  {
    title: "Event Details",
    fields: [
      { key: "eventType", label: "Event type" },
      { key: "preferredDates", label: "Preferred date(s)" },
      { key: "preferredTime", label: "Preferred time of day" },
      { key: "cityArea", label: "City / Area" },
      { key: "eventLocation", label: "Event location" },
    ],
  },
  {
    title: "Group Size & Profile",
    fields: [
      { key: "groupSize", label: "Number of participants" },
      { key: "teamProfile", label: "Team description" },
    ],
  },
  {
    title: "Goals & Outcomes",
    fields: [{ key: "goals", label: "Main goals" }],
  },
  {
    title: "Experience Preferences",
    fields: [
      { key: "experience", label: "Experience type" },
      { key: "musicPref", label: "Music preference" },
    ],
  },
  {
    title: "Logistics",
    fields: [
      { key: "sessionLength", label: "Session length" },
      { key: "specialConsiderations", label: "Special considerations" },
    ],
  },
  {
    title: "Additional Information",
    fields: [{ key: "additionalInfo", label: "Notes" }],
  },
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY is not configured");
    const resend = new Resend(resendKey);

    const { contactName, email, companyName, answers }: ConfirmationRequest = await req.json();
    if (!email || !contactName) throw new Error("Missing required fields: contactName, email");

    const sectionsHtml = SECTIONS.map(
      (sec) => `
        <h3 style="font-family: 'Quicksand', Arial, sans-serif; font-size: 16px; color: hsl(240,10%,16%); margin: 24px 0 8px;">${escapeHtml(sec.title)}</h3>
        <table style="width:100%; border-collapse: collapse; font-size: 14px;">
          ${sec.fields
            .map(
              (f) => `
            <tr>
              <td style="padding: 6px 12px 6px 0; color: hsl(240,5%,46%); vertical-align: top; width: 40%;">${escapeHtml(f.label)}</td>
              <td style="padding: 6px 0; color: hsl(240,10%,16%);">${formatVal(answers[f.key] ?? "")}</td>
            </tr>`,
            )
            .join("")}
        </table>
      `,
    ).join("");

    const html = `
      <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 32px 28px; background-color: #ffffff;">
        <img src="https://vbbfpzszmtwhydhpgtgj.supabase.co/storage/v1/object/public/email-assets/club-choir-logo.png?v=1" alt="Club Choir" width="120" style="margin-bottom: 24px;" />
        <h1 style="font-family: 'Quicksand', Arial, sans-serif; font-size: 24px; font-weight: bold; color: hsl(240,10%,16%); margin: 0 0 16px;">
          Thanks, ${escapeHtml(contactName)}!
        </h1>
        <p style="font-size: 15px; color: hsl(240,5%,46%); line-height: 1.6; margin: 0 0 16px;">
          We've received your corporate inquiry${companyName ? ` for <strong>${escapeHtml(companyName)}</strong>` : ""}. Someone from our team will reach out within <strong>48 hours</strong>.
        </p>
        <p style="font-size: 15px; color: hsl(240,5%,46%); line-height: 1.6; margin: 0 0 24px;">
          If you need information urgently, email us directly at
          <a href="mailto:ailsa@clubchoir.ca" style="color: hsl(340,75%,60%); text-decoration: underline;">ailsa@clubchoir.ca</a>.
        </p>

        <div style="border-top: 1px solid hsl(240,6%,90%); padding-top: 8px;">
          <h2 style="font-family: 'Quicksand', Arial, sans-serif; font-size: 18px; color: hsl(240,10%,16%); margin: 16px 0 4px;">Your inquiry summary</h2>
          ${sectionsHtml}
        </div>

        <p style="font-size: 12px; color: #999999; margin: 32px 0 0;">— The Club Choir Team</p>
      </div>
    `;

    const result = await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: [email],
      bcc: ["ailsa@clubchoir.ca"],
      subject: "We've received your Club Choir corporate inquiry",
      html,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-corporate-confirmation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
