# Project Architecture Rules

- Read member-file notes only through an owner-authorized database function and owner-restricted timeline policies; never include notes in shared member queries or public assets, so other administrators cannot access private notes.

- Store member event RSVPs as one authenticated-user row per event, protected by row-level access rules, so members can safely revise their own answer.
- Render paid attendance sheets as one continuous CSS multicolumn flow, not two pre-split lists, so printing fills each page's left column then right column before continuing to the next page.
- Showcase campaigns resolve all four invitation versions from the portal's location-specific uploads and block missing or mismatched files, so attachments never cross choir locations.
- One-time campaign schedules use private-token authentication, pinned campaign versions, local-time date bounds and self-removing jobs; scheduled sends are paced to respect provider limits and never require an open browser.