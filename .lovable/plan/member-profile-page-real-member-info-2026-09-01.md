# Member Profile page — real member info

Today the profile page shows almost nothing: an avatar, an admin badge (admins only) and a Sign Out button. That is why members keep saying "I clicked My Profile and nothing happened."

## What the page will show

A single clean card for a signed-in member:

- Full name
- Email address
- Membership status: Active / Inactive, with the "active until" date when set
- Home base location (Montreal, Hudson, Pointe-Claire, Saint-Hubert)
- Member since date
- Quick links: My Choir (this week at my location) and Fall 2026 Song Resources
- Sign out (and the existing admin shortcut for admins)

No payment amounts anywhere on this page, as requested.

## Editing

- **Name: yes, self-serve.** A member can fix a misspelling. Saves to their portal profile and to their member record so the CRM, lists and emails all use the corrected spelling.
- **Email: no self-serve change.** Instead, the page shows the email with a "Wrong email? Contact Ailsa" note linking to ailsa@clubchoir.ca, and the change is made by an admin in the CRM.
- **Location: read-only** with the same "contact Ailsa" note, since it drives schedules and lists.

## Why not let members change their own email (your question)

Letting members edit their email would cause real problems:

1. **Sign-in breaks for them.** Their email is their sign-in ID. A change requires a confirmation click in *both* the old and the new inbox; if they never confirm, they can still only sign in with the old one — which is exactly the confusion you have been fixing all week with magic links.
2. **Typos lock people out.** A mistyped new address can leave a member unable to sign in and unreachable by email.
3. **Records split.** Your registrations, payments, guest lists, campaign history and deliverability tracking are all keyed on email. A self-serve change creates a second identity and a member can silently disappear from the paid list or get a duplicate campaign email.
4. **Already-signed-in members are unaffected** by adding this page — nothing changes about their session or how they sign in. The risk only appears if we allow email self-editing, which this plan does not.

An admin-side email change (which you already do case by case, like Nada Chamas) keeps both the login and all the linked records in sync in one place.

## Does this add value?

Yes — modest but real. It turns a dead-end page into confirmation that "I'm registered, I'm active, this is my location", cuts down the "am I set up?" emails, lets members fix a misspelled name without writing to you, and gives them a clear path into My Choir and the song resources.

## Technical notes

- Data: read `profiles` (display_name, status, active_until, location) plus the matching `members` row by email (first/last name, location, joined) for the member-since date and home base.
- Name save: update `profiles.display_name` and the `members` first/last name for the same email. Existing profile trigger already blocks status changes by non-admins, so no new privilege surface.
- Verify `members` update policy allows a member to edit their own row by email; if not, add a narrowly scoped policy or a security-definer function that only updates the name fields for the caller's own email.
- Bilingual EN/FR strings added to `LanguageContext`; page stays `noindex`.
