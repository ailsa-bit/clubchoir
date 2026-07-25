
# Fall 2026 Email Campaign Plan

Send three bilingual campaigns from Lovable, each with one-click open house RSVP buttons and a "bring a friend" nudge.

## Segments (built from existing CRM data)

1. **Paid & confirmed** — profiles active OR members with a `session_registrations` row for `fall-2026` marked `paid`. Tone: thank you + open house reminder + bring a friend.
2. **Registered, not yet paid** — `session_registrations` rows for `fall-2026`, `open-house-2026`, or `try-a-session` where `payment_status != 'paid'` AND email is not in segment 1. Tone: gentle payment nudge + open house reminder + bring a friend.
3. **Everyone else** — every email in `members` NOT in segment 1 or 2, excluding archived members and rows without a valid email. Tone: invitation, open house dates, session info, bring a friend.

Dedupe by lowercased email across segments (paid wins, then registered, then everyone else).

## Email content (bilingual EN/FR, one template per segment)

Each email includes:
- Personal greeting (first name)
- Segment-specific opener (thank you / payment nudge / invitation)
- **Open house block**: all 4 locations with date, time, venue, address
- **Fall session block**: rehearsal day/time per location (segment 3 gets more prominence)
- **Bring a friend line**: "Know someone who'd love to sing? Forward this email or bring them along — friends, neighbours, anyone curious is welcome."
- **One-click RSVP buttons**: 4 buttons, one per open house location. Clicking records the RSVP and shows a thank-you page.
- Contact line: ailsa@clubchoir.ca

For paid members, also link to the members-only login and song resources.

## One-click RSVP mechanism

- New table `open_house_rsvps` (email, first_name, last_name, location, token, created_at, source_campaign).
- Each email generates a signed token per recipient. Buttons link to `/rsvp?token=…&location=…`.
- New public page `/rsvp` calls a new edge function `record-open-house-rsvp` which validates the token, upserts into `open_house_rsvps`, tags the member with `open-house-2026` in the CRM, and shows a friendly confirmation.
- RSVPs appear as a new stat card + filter in the CRM.

## Admin campaign UI

New page `/campaigns` (admin only), reachable from Profile dropdown:
- Three cards, one per segment, showing recipient count.
- Preview button (renders the exact email in a modal with a sample name).
- "Send test to me" button before the big send.
- "Send campaign" button with confirmation dialog showing final recipient count.
- After send: shows success/failed counts and a downloadable CSV of failures.

## Sending infrastructure

- Reuse the existing `send-member-email` edge function pattern (Resend, batches of 10, admin JWT verification).
- New edge function `send-campaign` accepts `{ segment: 'paid' | 'registered' | 'everyone', testEmail?: string }`, builds the recipient list server-side (never trusts client), renders the correct bilingual template with per-recipient RSVP tokens, and sends via Resend from `Club Choir <noreply@clubchoir.ca>`.
- Rate-limited to stay well under Resend limits; logs each send to a new `campaign_sends` table for audit and to prevent accidental double-sends (per-recipient uniqueness per campaign).

## Technical summary

- New DB: `open_house_rsvps`, `campaign_sends` tables + RLS + grants.
- New edge functions: `send-campaign`, `record-open-house-rsvp`.
- New pages: `/campaigns` (admin), `/rsvp` (public).
- CRM updates: new "Open House RSVPs" stat card + filter, and a "Campaign history" panel showing last send per segment.
- All copy stored in the edge function (bilingual) so you can edit wording easily before sending.

## What you'll do

1. Approve this plan.
2. I build everything.
3. You visit `/campaigns`, preview each of the 3 emails, send a test to yourself.
4. When happy, click Send on each segment.
