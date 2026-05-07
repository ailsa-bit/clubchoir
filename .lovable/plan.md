I found that the ticket email QR code is currently hardcoded to `https://clubchoir.ca/checkin/<token>`. The live custom domain is returning the app’s 404 page for that route right now, while the current preview code does contain the `/checkin/:token` route. To make this robust immediately, I’ll update the QR/ticket flow so scanned links go through a backend redirect that is already live automatically, instead of relying on whether the public frontend has been updated yet.

Plan:
1. Add a new backend function for ticket redirects
   - Create a `popup-ticket-redirect` backend function.
   - It will accept a ticket token from the URL query string.
   - If the token exists in `popup_ticket_reservations`, it redirects to the app’s `/checkin/<token>` page.
   - If the token is missing or invalid, it returns a clear “Ticket not found” message instead of a confusing blank/404 state.

2. Update QR code generation
   - Change `notify-popup-paid` so future QR codes point to the redirect URL instead of directly to `clubchoir.ca/checkin/<token>`.
   - Keep the visible fallback link in the email aligned with the QR code.
   - This means newly resent ticket emails will scan correctly without depending on custom-domain route freshness.

3. Improve the admin check-in page error handling
   - Keep the existing guard for placeholder tokens like `/checkin/:token`.
   - Add friendlier wording for genuinely missing/deleted/cancelled tickets.
   - Prevent a failed lookup from feeling like the app crashed.

4. Add a quick admin-facing direct link in reservations
   - Add an “Open check-in” link/button beside paid reservations that already have a ticket token.
   - This gives you a way to verify a ticket/check-in page from the reservations list without scanning the QR.

5. Verify after implementation
   - Confirm the generated QR target no longer hardcodes only the broken direct route.
   - Test the redirect function with an existing valid ticket token from the reservation data.
   - Check that an invalid token gives a clear message instead of a 404 page.