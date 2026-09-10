# Montreal Location Move Announcement Email

## Goal
Send a bilingual announcement to all **paid Montreal members** about the venue move to Paroisse Notre-Dame-De-Grâce (5333 avenue Notre-Dame-De-Grâce, corner Décarie), effective Monday, September 14.

## Changes

### 1. New campaign segment in `supabase/functions/send-campaign/index.ts`
- Add segment `montreal-location-move` with campaign key `fall-2026-montreal-location-move-v1`.
- Recipients: paid Montreal members only (active members with a paid Fall 2026 registration at Montreal), same targeting logic as existing paid segments.
- Exclusions preserved: `no-email` tags, test account, never-email list, Montreal welcome exclusion not applicable here.

### 2. Bilingual email content (EN + FR in one email, like other campaigns)
- **Thank-you opener:** thanks to everyone who attended Monday's wonderful first evening; a warm note for those who weren't there but are joining later.
- **Announcement:** due to circumstances beyond Ailsa's control, Club Choir Montreal is moving to **Paroisse Notre-Dame-De-Grâce, 5333 avenue Notre-Dame-De-Grâce (corner Décarie)**.
- **Positives:** bigger space that fits everyone comfortably, parking lot, closer to Villa-Maria metro, incredible acoustics.
- **Reassurance:** acknowledges it's a little further for some and more convenient for others; every effort was made to stay as close as possible to Kensington.
- **Effective date:** meeting at the new space starting **Monday, September 14**.
- **Repeat notice:** a second email will follow in case anyone misses this one; apology in advance for the repeated message.
- **Resources teaser:** new resources and the weekly message coming tomorrow — keep an eye out.
- Sign-off from Ailsa (Tra-la-la), contact email ailsa@clubchoir.ca.

### 3. Campaigns page (`src/pages/Campaigns.tsx`)
- Add a card "Montreal — Venue Move Announcement" showing recipient count and not-yet-sent count, with Preview / Test (to Ailsa only) / Send buttons, same as existing campaign cards.

### 4. Safety
- Existing safeguards apply automatically: test sends locked to ailsa@clubchoir.ca, preflight manifest with recipient fingerprint required before real send, duplicate-send suppression per campaign key.

### 5. Deploy & verify
- Deploy `send-campaign`, confirm the new card appears on `/campaigns`, and show a test preview to Ailsa before any real send. No email is sent as part of this change.
