# GEARAWAI — Decisions made during development

Decisions D-01 – D-10 are recorded in `GEARAWAI_SYSTEM_ANALYSIS.md` §8. This file records decisions taken after
development started. The original specification documents are not edited.

| Code | Date | Decision | Effect |
|---|---|---|---|
| D-11 (R-32) | 2026-11-11 | **Accept the risk (option ก).** A member may set their birth date for the first time to the current month and claim the birthday coupon immediately. No extra rule is added. | No schema/RPC change. Impact is limited to 1 coupon per account per year (unique `user_id, coupon_id, cycle_year`). Birth date stays optional (D-08) and can be changed once after the first set. |
| D-12 | 2026-11-11 | Brought forward from Phase 5 into Phase 3: basic Admin **Orders** and **Payments** screens. | Lets the full order flow (pay → verify → ship → complete → points) be tested end to end before Phase 4. |
| D-13 | 2026-11-11 | Test orders/bookings created while testing are flagged `is_demo = true`. | Reports can exclude them (SPEC §10). |
