## CRM Plan

### Goal
Give admins a single place to manage every person associated with Club Choir — members, prospects, session registrants, popup attendees, and signed-up users — without creating a parallel contacts database.

### Technical approach
- One new admin route `/crm` (and `/crm/:id` detail view) that aggregates existing tables on the fly.
- Extend `public.members` with small CRM fields: `crm_tags` (text array), `source` (text), `follow_up_date` (date), and add them to the existing `member_notes` timeline.
- Reuse `/send-email` for bulk outreach: the CRM builds a recipient list (emails + display names) and navigates to `/send-email?to=...&segment=...`.

### What will be built

1. Database migration
   - Add to `public.members`: `crm_tags text[] default '{}'`, `source text default ''`, `follow_up_date date`.
   - Keep existing columns untouched.

2. Edge Function: `crm-search`
   - Admin-only, service-role search across members, prospects, profiles, session_registrations, popup_ticket_reservations, popup_waitlist.
   - Returns unified rows: id, type, first_name, last_name, email, location, status, source, tags, last_contact.

3. Frontend pages
   - `/crm` — searchable, filterable contact list with status badges, location/source chips, and multi-select.
   - `/crm/:id` — contact detail drawer/page: profile info, notes timeline, registration history, emails sent, quick actions (approve, add note, set follow-up).

4. Navigation
   - Add "CRM" to the admin navigation menu, visible only to admins.

5. Bulk email hand-off
   - "Email this segment" button on `/crm` passes selected emails to `/send-email` as query params.

6. Quick stats
   - Dashboard cards at the top of `/crm`: total contacts, active members, prospects, pending approvals, by-location counts.

### Out of scope (for now)
- Marketing email campaigns / automated drip sequences.
- Two-way email sync.
- Calendar/task integration beyond follow-up date.
- Pipedrive/HubSpot/Zoho/Salesforce connectors unless requested later.

### Next steps
Approve this plan and I’ll start with the migration, then the edge function, then the UI.