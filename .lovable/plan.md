## Current state (read-only audit)

**`members` (363 rows)** — status × payment_status:

| status | payment_status | count |
|---|---|---|
| ACTIVE | PAID | 152 |
| ACTIVE | Paid | 23 |
| ACTIVE | *(blank)* | 17 |
| ACTIVE | OWES | 3 |
| ACTIVE | PROBONO | 3 |
| ACTIVE | NA | 2 |
| ACTIVE | Pending | 1 |
| INACTIVE | NA | 50 |
| INACTIVE | Paid/PAID/OWES/blank | 4 |
| PROSPECT | NA | 61 |
| PROSPECT | *(blank)* | 7 |
| TRIAL | NA | 40 |

→ **201 ACTIVE** members today. All should become **INACTIVE** (Winter 2026 is over, nobody is enrolled).

**`member_sessions` (229 rows)**: Winter 2026 = 95, Fall 2026 = 78, Fall 2025 = 49, Summer 2026 = 6, Winter 2025 = 1.

**`hudson_session_signups`**: 32 rows. 8 already exist in `members` (all currently ACTIVE — same people).
**`prospects`**: 7 rows. None overlap with `members`.
**`popup_ticket_reservations`**: 4 rows, all paid. 1 overlaps members (Danna Vincent, already PROSPECT).

---

## Proposed bulk cleanup

### Step 1 — Reset every ACTIVE member to INACTIVE
All 201 ACTIVE rows → `status = 'INACTIVE'`. This covers the Winter 2026 cohort and the 100 ACTIVE members not linked to any session row.

### Step 2 — Normalize `payment_status` across the whole table
Map all current values to the new enum:

| current | new |
|---|---|
| PAID, Paid | `PAID` |
| PROBONO | `COMPED` |
| OWES | `OWES` |
| NA, *(blank)*, Pending | `NOT_REQUIRED` |

Since no session is running, after Step 1 there should be **no UNPAID rows**. `Pending` (1 row, Indy Gos, TRIAL) → flag for manual review but default to `NOT_REQUIRED`.

### Step 3 — Apply Fall 2026 PROSPECT status
For every member linked to `member_sessions.session_name = 'Fall 2026'` who is not already PROSPECT/TRIAL → set `status = 'PROSPECT'`, `payment_status = 'NOT_REQUIRED'`. (Fall 2026 = interested, not registered.)

Current Fall 2026 linkage: 40 PROSPECT, 17 TRIAL, 11 INACTIVE, 2 ACTIVE → after Step 1+3, the 2 ACTIVE and 11 INACTIVE become PROSPECT; existing TRIAL stays TRIAL.

### Step 4 — Hudson signups → Fall 2026 PROSPECTs
- For the **8 Hudson signups already in members** (Barbara Gottel, Belinda Jarry, Deirdre McCormack, Judy Paul, Eileen McAleese, Sylvie/André, Alexandra Dalgleish): set `status='PROSPECT'`, `location='Hudson'`, `payment_status='NOT_REQUIRED'`, and ensure a Fall 2026 row in `member_sessions`.
  - ⚠️ Alexandra Dalgleish currently has `location='Pointe-Claire'` — needs manual confirm before overwriting to Hudson.
- For the **24 Hudson signups not in members**: insert new `members` rows with `status='PROSPECT'`, `location='Hudson'`, `payment_status='NOT_REQUIRED'`, plus a Fall 2026 `member_sessions` row.

### Step 5 — `prospects` table → fold into members
7 rows, none overlap members. Insert into `members` with `status='PROSPECT'`, `location=locations[1]` (Reagan Niedan has two locations — manual pick), `payment_status='NOT_REQUIRED'`. Add a Fall 2026 `member_sessions` row each. Heather (last row) has no last name — flag.

### Step 6 — `popup_ticket_reservations` — leave alone
Stays separate. Only Danna Vincent overlaps (already PROSPECT). No changes.

### Step 7 — Ensure no one is REGISTERED / UNPAID
Verification query: after the run, expect `0` rows with `status='REGISTERED'` and `0` with `payment_status='UNPAID'`.

---

## Records flagged for manual review before running

1. **Duplicate emails in `members` (8 pairs — looks like couples sharing one inbox):**
   - davepaper@gmail.com — David Carruthers / Denise Lapointe
   - kz.lupita@gmail.com — Lupita Zambelli / Vito Longo
   - nakano.cho@videotron.ca — Edward Cho / Jane Nakano
   - karenvaage65@gmail.com — Harold Griffiths / Karen Vaage
   - bgallay@gsmcpa.ca — Brahm Gallay / Maria Elana Antunez
   - aluddie@icloud.com — Annette / Eric Ludwick
   - glpalardy@gmail.com — Gary / Linda Palardy
   - paulamalo@hotmail.com — Mary Ellen / Paula Malolepszy
   - → Leave both rows; the cleanup treats them as separate people. Confirm this is fine (the `handle_new_user` trigger only matches on email so only one will auto-activate when they sign up).

2. **Location anomalies:** 1 member with blank location, 1 with `Laval`. Decide a target value.

3. **Alexandra Dalgleish** — in Hudson signups but currently `location='Pointe-Claire'`. Confirm move to Hudson or keep Pointe-Claire and just add Fall 2026 Hudson session row.

4. **Sylvie et André** (`sylvielad.andre@gmail.com`) — one members row, two Hudson signups (duplicate). Will dedupe the Hudson side.

5. **Indy Gos** — currently `payment_status='Pending'`. Default to `NOT_REQUIRED` unless you want OWES.

6. **Heather (prospects table)** — no last name.

7. **Reagan Niedan (prospects table)** — locations `[Hudson, Pointe-Claire]`. Pick one for the `members.location` field.

8. **3 ACTIVE members currently marked `OWES`** — after Step 1 they become INACTIVE with `OWES`. Confirm you still want to track the debt or wipe to `NOT_REQUIRED`.

---

## Risks & assumptions

- **Assumption:** "All current ACTIVE → INACTIVE" applies to every ACTIVE row regardless of session linkage, including the 100 ACTIVE members with no `member_sessions` history.
- **Assumption:** Fall 2026 PROSPECT outranks "leftover INACTIVE" — if someone is linked to Fall 2026 they become PROSPECT, not INACTIVE.
- **Assumption:** Existing TRIAL members stay TRIAL (the rules don't say to reset trials).
- **Risk:** The `handle_new_user` trigger only auto-activates a profile when a matching member is `status='ACTIVE'`. After this cleanup, **nobody** will auto-activate on signup until you flip members back to ACTIVE for the next session. Confirm this is the desired behaviour between sessions.
- **Risk:** No backups are taken inside Lovable. Recommend exporting `members`, `member_sessions`, `hudson_session_signups`, `prospects` to CSV before running. I can generate those CSVs first.
- **Reversibility:** Updates are destructive (old `payment_status` strings like `Paid`, `NA`, `PROBONO` are lost). CSV export mitigates this.

---

## Execution order once you approve

1. Export CSV snapshots of the 5 tables to `/mnt/documents/`.
2. Resolve the 8 manual-review items above.
3. Run Step 1 → 2 → 3 → 4 → 5 as separate `UPDATE`/`INSERT` statements so each can be verified.
4. Run verification queries (no REGISTERED, no UNPAID, all payment_status values in the new enum, every Fall 2026 member is PROSPECT or TRIAL).
