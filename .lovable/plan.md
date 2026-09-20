# Winter/Spring 2027 Early Registration

## Goal
Replace Fall 2026 registration messaging with early registration for the Winter/Spring 2027 session, which begins in late February 2027 with the detailed schedule still to be confirmed.

## Changes
- Update the homepage’s main registration button and other public registration calls-to-action to say “Early registration for Winter/Spring 2027” in English and French.
- Update the registration page to begin with: “We are no longer accepting new members for the Fall/Winter 2026 session.” Add that early registrants will be the first to receive details as soon as the new session schedule is announced.
- Replace old Fall dates, venues, fee/payment promises, titles, success messages, and search descriptions on the registration page with Winter/Spring 2027 early-registration wording and “late February / schedule to be determined.”
- Keep the four-location selection so early interest is recorded by preferred location.
- Store new submissions under a new Winter/Spring 2027 session label, leave them unpaid/prospective, and send a bilingual early-registration confirmation instead of Fall payment instructions.
- Update location-page and legacy Fall-registration-page buttons so every public route points to the same early-registration offer.

## Technical details
- Update the React registration views and bilingual translation entries.
- Update and redeploy the registration function so it records `winter-spring-2027`, checks duplicates within that session, and sends only early-information confirmations.
- Verify the English and French pages, mobile/desktop button text, successful form submission behavior, and preview build health.
