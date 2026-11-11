# GEARAWAI — Decisions made during development

Decisions D-01 – D-10 are recorded in `GEARAWAI_SYSTEM_ANALYSIS.md` §8. This file records decisions taken after
development started. The original specification documents are not edited.

| Code | Date | Decision | Effect |
|---|---|---|---|
| D-11 (R-32) | 2026-11-11 | **Accept the risk (option ก).** A member may set their birth date for the first time to the current month and claim the birthday coupon immediately. No extra rule is added. | No schema/RPC change. Impact is limited to 1 coupon per account per year (unique `user_id, coupon_id, cycle_year`). Birth date stays optional (D-08) and can be changed once after the first set. |
| D-12 | 2026-11-11 | Brought forward from Phase 5 into Phase 3: basic Admin **Orders** and **Payments** screens. | Lets the full order flow (pay → verify → ship → complete → points) be tested end to end before Phase 4. |
| D-13 | 2026-11-11 | Test orders/bookings created while testing are flagged `is_demo = true`. | Reports can exclude them (SPEC §10). |
| D-14 | 2026-11-12 | Migration `20261112000019_report_demo_filter.sql`: the five `report_*` RPCs get an optional `p_include_demo boolean default true`. Same logic as the schema draft; old signatures dropped, still `security definer` + `_assert_admin()`, EXECUTE for `authenticated` only (anon revoked). Approved by the user before `db push`. | Implements ADMIN §4.16 "ไม่รวม Demo Data". The five report RPCs filter on `orders.is_demo = false`; the "new members in range" count on the Customer report is a direct `profiles` query and filters on `profiles.is_demo = false`. Default keeps the draft's behaviour. `admin_dashboard_stats` is unchanged (§4.1 has no Demo option). |
| D-15 | 2026-11-12 | Settings → Commerce also edits `birthday_rule.coupon_id` (a select limited to `coupon_type = 'birthday'`); `window` stays `birth_month`. Discount/conditions of the template are edited in Coupons. | ADMIN §4.18 lists `birthday_rule` under Commerce; only the coupon link is a setting. |
| D-16 | 2026-11-12 | Print-to-PDF page (`/admin/reports/print`, D-09) prints stat cards + tables on a light token scope; on-screen charts are omitted from print. Excel export (exceljs) puts all five reports in one workbook, each sheet with the required header. | Charts are tuned for the dark screen theme; the tables carry every number. |
