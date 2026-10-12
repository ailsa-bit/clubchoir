# Project Architecture Rules

- Store member event RSVPs as one authenticated-user row per event, protected by row-level access rules, so members can safely revise their own answer.
- Render paid attendance sheets as one continuous CSS multicolumn flow, not two pre-split lists, so printing fills each page's left column then right column before continuing to the next page.