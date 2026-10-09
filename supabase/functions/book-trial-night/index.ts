import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOCATION_INFO: Record<string, { day: string; dayFr: string; time: string; altTime?: string; altWeeks?: number[]; venue: string }> = {
  Montreal: {
    day: "Monday",
    dayFr: "lundi",
    time: "7:00–8:30 PM",
    venue: "Paroisse Notre-Dame-De-Grâce, 5333 avenue Notre-Dame-De-Grâce (corner Décarie), Montréal",
  },
  Hudson: {
    day: "Tuesday",
    dayFr: "mardi",
    time: "7:00–8:30 PM",
    venue: "The Hudson Legion, 57 Beach Road, Hudson",
  },
  "Saint-Hubert": {
    day: "Wednesday",
    dayFr: "mercredi",
    time: "7:00–8:30 PM",
    venue: "St-Gabriel Catholic Church, 5070 Rue Gilbert, Saint-Hubert",
  },
  "Pointe-Claire": {
    day: "Thursday",
    dayFr: "jeudi",
    time: "7:00–8:30 PM",
    venue: "Valois United Church, 70 Av. Belmont, Pointe-Claire",
  },
};

const BodySchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().max(100).optional().default(""),
  email: z.string().trim().email().max(255),
  location: z.enum(["Montreal", "Hudson", "Saint-Hubert", "Pointe-Claire"]),
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  week: z.number().int().min(1).max(14).optional(),
  song: z.string().trim().max(200).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
  language: z.enum(["en", "fr"]).optional().default("en"),
});

const escapeHtml = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const fmtDate = (iso: string, fr: boolean) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(fr ? "fr-CA" : "en-CA", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const { first_name, last_name, location, session_date, week, song, notes, language } = parsed.data;
    const email = parsed.data.email.toLowerCase();
    const isFr = language === "fr";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // One booking per person — update if they book again.
    const { data: existing } = await supabase
      .from("trial_guests")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    const row = {
      first_name,
      last_name,
      email,
      location,
      session_date,
      week: week ? `Week ${week}` : null,
      song: song || null,
      notes: notes || null,
    };

    if (existing?.id) {
      await supabase.from("trial_guests").update(row).eq("id", existing.id);
    } else {
      const { error: insErr } = await supabase.from("trial_guests").insert(row);
      if (insErr) throw insErr;
    }

    // Also make the guest visible in the CRM (best-effort — never blocks the booking).
    try {
      const { data: memberRows } = await supabase
        .from("members")
        .select("id, crm_tags")
        .ilike("email", email)
        .limit(1);

      let memberId: string | null = memberRows?.[0]?.id ?? null;

      if (memberId) {
        const tags: string[] = memberRows![0].crm_tags || [];
        if (!tags.includes("try-a-session")) {
          await supabase
            .from("members")
            .update({ crm_tags: [...tags, "try-a-session"] })
            .eq("id", memberId);
        }
      } else {
        const { data: created, error: cErr } = await supabase
          .from("members")
          .insert({
            first_name,
            last_name,
            email,
            location,
            status: "PROSPECT",
            source: "try-a-session",
            crm_tags: ["try-a-session"],
            joined: new Date().toISOString().slice(0, 10),
            notes: notes || "",
          })
          .select("id")
          .single();
        if (cErr) console.error("trial member create err:", cErr);
        memberId = created?.id ?? null;
      }

      const { data: dupReg } = await supabase
        .from("session_registrations")
        .select("id")
        .ilike("email", email)
        .eq("session_label", "try-a-session")
        .eq("location", location)
        .maybeSingle();

      if (!dupReg) {
        const { error: regErr } = await supabase.from("session_registrations").insert({
          member_id: memberId,
          session_label: "try-a-session",
          location,
          first_name,
          last_name,
          email,
          notes: notes || null,
          payment_status: "free",
        });
        if (regErr) console.error("trial registration insert err:", regErr);
      }
    } catch (crmErr) {
      console.error("trial CRM sync err:", crmErr);
    }

    const info = LOCATION_INFO[location];
    const time = info.altWeeks && week && info.altWeeks.includes(week) ? info.altTime! : info.time;
    const fullName = `${first_name} ${last_name}`.trim();

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const resend = new Resend(resendKey);

      await resend.emails.send({
        from: "Club Choir <noreply@clubchoir.ca>",
        to: ["ailsa@clubchoir.ca"],
        replyTo: email,
        subject: `🎤 Guest list — ${location}, ${fmtDate(session_date, false)}`,
        html: `
          <h2>New trial-night guest</h2>
          <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Location:</strong> ${escapeHtml(location)}</p>
          <p><strong>Evening:</strong> ${escapeHtml(fmtDate(session_date, false))} · ${escapeHtml(time)}</p>
          <p><strong>Song that night:</strong> ${escapeHtml(song || "—")}</p>
          <p><strong>Message:</strong> ${escapeHtml(notes || "—").replace(/\n/g, "<br/>")}</p>
        `,
      });

      const block = (fr: boolean) => `
        <ul style="font-family:'Nunito',Arial,sans-serif;color:#333;line-height:1.7;padding-left:18px;">
          <li><strong>${fr ? "Quand" : "When"} :</strong> ${escapeHtml(fmtDate(session_date, fr))}, ${escapeHtml(time)}</li>
          <li><strong>${fr ? "Où" : "Where"} :</strong> ${escapeHtml(info.venue)}</li>
          <li><strong>${fr ? "Chanson de la soirée" : "Song that night"} :</strong> ${escapeHtml(song || "—")}</li>
        </ul>`;

      await resend.emails.send({
        from: "Club Choir <noreply@clubchoir.ca>",
        to: [email],
        replyTo: "ailsa@clubchoir.ca",
        subject: isFr
          ? `Vous êtes sur la liste d'invités — Club Choir ${location}`
          : `You're on the guest list — Club Choir ${location}`,
        html: `
        <div style="font-family:'Nunito',Arial,sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px;">
          <h1 style="font-family:'Quicksand',Arial,sans-serif;font-size:22px;margin:0 0 12px;">
            Hi ${escapeHtml(first_name)} — you're on the guest list! 🎶
          </h1>
          <p style="line-height:1.6;color:#333;">You're booked to try a free evening with Club Choir ${escapeHtml(location)}.</p>
          ${block(false)}
          <p style="line-height:1.6;color:#333;">Come a few minutes early so we can say hello and get you settled. Bring a pen or pencil, your glasses if you use them, and a water bottle. Lyrics are provided — no experience and no music reading needed.</p>
          <p style="line-height:1.6;color:#333;"><strong>There is no pressure to commit.</strong> Come with an open mind — we are a very friendly group and we look forward to meeting you.</p>
          <p style="line-height:1.6;color:#333;">If it feels like the right fit, you can register early for our Winter/Spring 2027 session at <a href="https://clubchoir.ca/register">clubchoir.ca/register</a>.</p>
          <p style="line-height:1.6;color:#333;">Questions or need to change your evening? Just send an email to <a href="mailto:ailsa@clubchoir.ca">ailsa@clubchoir.ca</a>.</p>
          <p style="line-height:1.6;color:#333;margin-top:20px;">See you soon!<br/><strong>Ailsa & the Club Choir team</strong></p>
          <hr style="border:none;border-top:1px solid #eee;margin:28px 0;" />
          <div style="font-size:13px;color:#555;line-height:1.6;">
            <p style="margin:0 0 12px;"><strong>En français :</strong></p>
            <p style="margin:0 0 12px;">Bonjour ${escapeHtml(first_name)}, vous êtes sur la liste d'invités ! Vous venez essayer gratuitement une soirée avec Club Choir ${escapeHtml(location)}.</p>
            ${block(true)}
            <p style="margin:0 0 12px;">Arrivez quelques minutes à l'avance. Apportez un crayon, vos lunettes au besoin et une bouteille d'eau. Les paroles sont fournies — aucune expérience ni lecture de musique requise.</p>
            <p style="margin:0 0 12px;"><strong>Aucune pression pour vous engager.</strong> Venez l'esprit ouvert — nous formons un groupe très chaleureux et nous avons hâte de vous rencontrer.</p>
            <p style="margin:0 0 12px;">Si le courant passe, vous pouvez faire une inscription anticipée pour la session hiver/printemps 2027 : <a href="https://clubchoir.ca/register">clubchoir.ca/register</a>.</p>
            <p style="margin:0;">Des questions ? Écrivez à <a href="mailto:ailsa@clubchoir.ca">ailsa@clubchoir.ca</a>.</p>
          </div>
        </div>`,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("book-trial-night error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
