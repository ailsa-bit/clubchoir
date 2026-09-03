# Make Campaign Sending Safe

## Goal
Prevent test emails from reaching anyone except Ailsa and require a verified send plan before any real campaign email is released.

## Changes
- Lock test delivery in the backend to `ailsa@clubchoir.ca`; ignore or reject every other test destination.
- Add a server-generated preflight manifest containing each recipient’s name, email, location, segment, and subject.
- Block sending when a recipient has a missing/invalid name, email, or location, or does not belong to the selected segment and location.
- Require the real send request to match the exact recipient count and fingerprint from the reviewed preflight; stop if records changed between review and send.
- Update the campaign confirmation screen to show the exact recipients and flag any validation problems before enabling Send.
- Apply the same preflight verification to one-person payment-confirmation emails.
- Deploy and test the updated email function without sending any email.

## Audit Result
Since September 2, test emails were sent to four non-admin recipients: David Dannenbaum, Liz Chidiac, Carolina Lopez, and Mari-Rose Thompson. Test sends were not recorded in the normal campaign-send history, which is why the issue was not visible there.
