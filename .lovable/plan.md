## Goal

A member's profile is `active` **only** when they have a paid registration for the current session. Access auto-expires when the session ends.

## Important finding first

Fall 2026 registration in this app is **e-transfer, not Stripe**. The `Register` page collects info and emails e-transfer instructions; you mark someone "paid" manually in the admin. There is a `session_registrations.payment_status` field ('unpaid' / 'paid') that already tracks this. Right now: **21 unpaid registrations, 0 paid**.

So "paid in Stripe" isn't the trigger we can use — the trigger is `session_registrations.payment_status = 'paid'` for `session_label = 'fall-2026'`. Everything below is built on that.

If you're planning to switch Fall registration to Stripe checkout instead of e-transfer, that's a separate (bigger) change — flag it and I'll plan it separately.

## The activation rule

A profile becomes `active` when:
- The user's email has a row in `session_registrations` with `session_label = 'fall-2026'` **and** `payment_status = 'paid'`
- AND today is on or before **Dec 10, 2026**

Otherwise the profile is `inactive`. Admin role is unaffected (admins keep admin powers regardless).

## What changes

### 1. Database

- Add `profiles.active_until DATE` (nullable). Stores the expiry date for paid access.
- Update `is_active_member(uuid)` function to also check `active_until >= current_date` when set. Existing gated pages already call this — no page code changes needed.
- New DB function `activate_member_for_paid_registration(email TEXT, until DATE)` (SECURITY DEFINER): finds the profile by email via `auth.users`, sets `status = 'active'` and `active_until`, bypassing the admin-only status guard.
- New DB function `expire_stale_members()`: sets `status = 'inactive'` for profiles where `active_until < current_date`. Callable by cron or on demand.

### 2. Payment-marks-paid flow (admin action)

When you mark a registration paid in the admin (Manage Prospects / Manage Members), we call `activate_member_for_paid_registration` with the registrant's email and `2026-12-10`. If they've already signed up with that email, they flip to active immediately. If they haven't signed up yet, nothing happens now — the next step covers that.

### 3. Sign-up after paying

Change `handle_new_user` trigger so new sign-ups are:
- `active` (with `active_until = 2026-12-10`) if their email has a **paid** `session_registrations` row for fall-2026
- `inactive` otherwise (current behavior of matching against `members.status = 'ACTIVE'` is removed for activation — that table stays as a roster/CRM, but no longer grants access)

### 4. Backfill "existing paid" members

- Reactivate `ailsa@clubchoir.ca` immediately (`status='active'`, `active_until='2026-12-10'`).
- For every profile whose email is in `session_registrations` with `session_label='fall-2026' AND payment_status='paid'`: set `status='active'`, `active_until='2026-12-10'`. (Currently 0 rows match — will grow as you mark people paid.)
- All 156 other profiles stay inactive.

### 5. Auto-expire on Dec 10

Two options — I'll pick one based on your call:
- **(a) Passive:** `is_active_member` already checks `active_until >= today`, so on Dec 11 gated pages just start returning inactive. No cron needed. Simplest and reliable.
- **(b) Active:** run `expire_stale_members()` nightly via pg_cron so `profiles.status` also flips to 'inactive' visibly in admin lists.

Recommendation: **(a)** for now, add (b) later if you want the admin table to visibly reflect expiry.

### 6. Admin UX

In `ManageProspects` / `ManageMembers`, the "mark paid" action already exists on `session_registrations` (or will — flag if you want me to add/verify the toggle). When toggled to paid, it also calls the activation function. Add a small "Access until: Dec 10, 2026" label on the member's row when active_until is set.

## Files touched

- **New migration** (schema + functions + backfill in one)
- `supabase/functions/register-session/index.ts` — no change (still handles registration + e-transfer email)
- `src/pages/ManageProspects.tsx` and/or `ManageMembers.tsx` — wire "mark paid" toggle to also call activation RPC (I'll read these first and confirm exact location)
- No changes needed on Resources / This Week / Location Chat pages — they already gate through `is_active_member`

## Out of scope (flag for later)

- Switching Fall 2026 registration itself to Stripe Checkout
- Winter/Spring 2027 sessions (add another `session_label` when the time comes)
- Drop-in / try-a-session temporary access
