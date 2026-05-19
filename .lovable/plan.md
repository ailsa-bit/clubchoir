## Goal

A single public page `/register` where anyone can sign up for a Fall 2026 choir session (Montreal, Hudson, Saint-Hubert, Pointe-Claire, Arundel). No login required. Server detects whether the email already belongs to a member and links the signup to the existing record — no duplicates. Admin sends the Stripe payment link manually later.

## How existing members vs new people are handled

The key principle: **email is the identity key, dedup happens server-side, not in the form.** The form is the same for everyone — we don't ask "are you a member?". The backend decides.

When the form is submitted, an edge function does an email lookup against the `members` table (case-insensitive) and follows one of three branches:

```text
                ┌─ ACTIVE member found ─────► link signup to member_id
                │                              · update location if changed
email lookup ───┤                              · reply: "Welcome back!"
                │                              · NO new member row
                │
                ├─ INACTIVE / former member ──► reactivate (status = ACTIVE)
                │                              · link signup to existing member_id
                │                              · update location/joined if needed
                │
                └─ No match ────────────────► create new member (status = PENDING)
                                              · link signup to new member_id
                                              · reply: "Welcome to Club Choir!"
```

We also **block duplicate signups for the same session+location** by checking if a row already exists in the new signups table for that member + session — return a friendly "you're already registered" response instead of inserting again.

## Database

New table `session_registrations` (we won't reuse `hudson_session_signups` — keep that legacy table alone):

- `member_id` — links to `members.id` (set by edge function, never trusted from client)
- `session_label` — e.g. `"fall-2026"` (so this page can be reused next season)
- `location` — Montreal / Hudson / Saint-Hubert / Pointe-Claire / Arundel
- `first_name`, `last_name`, `email` — captured at submission (snapshot)
- `notes` — optional message from registrant
- `is_returning_member` — boolean snapshot (was a member at signup time)
- `payment_status` — default `'unpaid'`, admin marks `'paid'` later
- `payment_link_sent_at` — admin sets when they email the Stripe link
- Unique index on (`member_id`, `session_label`, `location`) to prevent dupes

RLS:
- Public INSERT blocked (only edge function with service role writes).
- Admin SELECT/UPDATE/DELETE via `has_role(auth.uid(), 'admin')`.

## Edge function: `register-session`

Public function (`verify_jwt = false`). Validates input with Zod, then:
1. Look up `members` by lowercased email.
2. Branch as shown above (match / reactivate / create).
3. Check uniqueness on (member_id, session_label, location); return `already_registered` if found.
4. Insert into `session_registrations`.
5. Send two emails via existing email infra:
   - Registrant: confirmation (bilingual, different copy for returning vs new).
   - Admin (ailsa@clubchoir.ca): notification with name, email, location, returning flag, notes.

## Frontend: `/register` page

- Bilingual page following existing patterns (PageMeta, Quicksand headings, solid colors, no gradients).
- Form fields: first name, last name, email, location (radio cards for the 5 locations using their existing color tokens), optional message.
- Arundel option shows "Dates to be confirmed" note but still submits.
- Client-side validation (zod) — non-empty trimmed name, valid email, location selected.
- On success: success card explaining "we'll email you a payment link to confirm your spot." Different copy if the API response says `returning_member: true`.
- On `already_registered`: friendly message + link to contact.

## Wiring

- Add `/register` route in `App.tsx`.
- Add a primary "Register for Fall 2026" CTA on the homepage hero (replacing the empty hidden div left from the Hudson removal) and on the Events page.
- Add nav link under Events dropdown in `Layout.tsx`.

## Admin view (small addition)

Extend the existing admin area with a `/manage-registrations` page listing rows from `session_registrations`, filterable by session + location, with buttons to:
- Mark "payment link sent" (timestamps the row).
- Mark "paid" (updates `payment_status` and also bumps the linked `members.payment_status`).

## Out of scope for this plan

- Stripe checkout from the page itself (admin sends link manually per your decision).
- Capacity limits / waitlists.
- Multi-session bulk registration in one submission.

## Technical notes

- Reuses existing `members` table and `handle_new_user` philosophy (email is the join key).
- Edge function is the only writer to `session_registrations` so RLS can stay locked.
- New members created via this flow get `status = 'PENDING'` (not ACTIVE) so they don't immediately appear in the member directory until Ailsa confirms payment and flips them to ACTIVE — keeps the directory clean.
- Emails reuse the existing transactional email pipeline (no new infra).
