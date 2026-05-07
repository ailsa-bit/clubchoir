# Paid confirmation email with QR code ticket

When an admin marks a pop-up reservation as paid on `/popup-reservations`, the attendee will automatically receive a thank-you email containing a QR code that can be scanned at the venue door to validate their ticket.

## How it will work

1. Admin clicks "Mark paid" on `/popup-reservations`.
2. The app sets `payment_received = true` in the database.
3. A new edge function `notify-popup-paid` fires, which:
   - Generates a unique ticket token for the reservation (stored in DB so it can be re-validated later).
   - Builds a QR code image encoding a check-in URL (e.g. `https://clubchoir.ca/checkin/<token>`).
   - Sends a branded email via Resend to the attendee with the QR inline + event details.
4. (Optional, included) A simple `/checkin/:token` page admins can open on their phone that looks up the reservation, shows attendee name + ticket count, and lets them mark as "checked in".

## Email contents

- Friendly thank-you ("Thanks, Jane! Your spot at Studio 77 is locked in 🎶")
- Event name, date, time, venue, address
- Ticket count and amount paid
- Large QR code (PNG embedded as base64)
- Plain-text fallback link to the check-in URL
- Reply-to: ailsa@clubchoir.ca

## Database changes

Add two columns to `popup_ticket_reservations`:
- `ticket_token` (text, unique) — random secure token used by the QR
- `checked_in_at` (timestamptz, nullable) — set when scanned at the door
- `paid_email_sent_at` (timestamptz, nullable) — prevents duplicate sends

Add an RLS policy so anyone with a valid token can read minimal reservation info via the check-in edge function (we'll do the lookup server-side using the service role to keep tokens safe — no broad public read policy needed).

## Files to create / change

**New:**
- `supabase/functions/notify-popup-paid/index.ts` — generates token if missing, builds QR (using `qrcode` npm package), sends email via Resend, marks `paid_email_sent_at`.
- `src/pages/CheckIn.tsx` — admin-only page that reads `:token` from URL, calls a new `popup-checkin-lookup` edge function, displays attendee details + "Mark checked in" button.
- `supabase/functions/popup-checkin-lookup/index.ts` — admin-only function that takes a token, returns reservation info, and can flip `checked_in_at`.

**Modified:**
- `src/pages/PopupReservations.tsx` — when toggling to paid, invoke `notify-popup-paid`. Show small badge if `checked_in_at` is set. Show "Resend ticket email" button for already-paid rows.
- `src/App.tsx` — register `/checkin/:token` route.

## Technical notes

- QR uses the `qrcode` npm library (`npm:qrcode@1.5.3`) inside the edge function to produce a base64 PNG data URL embedded in the email HTML via `<img src="data:image/png;base64,...">`. Resend supports inline images this way reliably.
- Token = `crypto.randomUUID()` — sufficient entropy, URL-safe.
- Email is idempotent: if `paid_email_sent_at` is already set, the function skips sending unless an explicit `resend: true` flag is passed (used by the "Resend ticket email" button).
- Check-in page is gated by `useAdmin()`.
- All event metadata (name, date, venue) reuses the existing `EVENTS` map from `notify-popup-reservation/index.ts` — extracted into a shared spot or duplicated in the new function (duplicated for simplicity, only one event right now).

Approve to proceed.
