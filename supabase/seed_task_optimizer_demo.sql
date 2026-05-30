-- Demo / test data for the Task Optimizer "View Submissions" log.
-- Safe to run in the Supabase SQL Editor. NOT a migration (won't auto-apply).
-- All rows use hospital_type = 'hope' so they show for the Hope hospital.
-- Remove later with:  DELETE FROM public.task_optimizer_logs WHERE user_email LIKE '%@demo.hope';

INSERT INTO public.task_optimizer_logs
  (user_email, hospital_type, staff_name, designation, log_date, tasks, ai_suggestions, created_at)
VALUES
-- ── Today (2026-05-30) ──
(
  'priya.nurse@demo.hope', 'hope', 'Priya Sharma', 'Nursing', '2026-05-30',
  '["Enter patient vitals into the system","Call patients to confirm appointments","Prepare daily census report","Restock ward medicine trolley"]'::jsonb,
  '[
    {"task":"Enter patient vitals into the system","type":"automate","suggestion":"Use bedside tablets with the EMR vitals form so readings sync directly.","rationale":"Removes double entry and transcription errors.","tool":"EMR vitals module / tablet"},
    {"task":"Call patients to confirm appointments","type":"automate","suggestion":"Send automated WhatsApp/SMS confirmation with a reply-to-confirm link.","rationale":"Cuts manual calls by ~80%.","tool":"WhatsApp Business API"},
    {"task":"Prepare daily census report","type":"automate","suggestion":"Auto-generate the census from admitted/discharged data each morning.","rationale":"Report becomes a one-click export.","tool":"IPD Dashboard report"},
    {"task":"Restock ward medicine trolley","type":"keep","suggestion":"Keep manual but use a par-level checklist.","rationale":"Physical stocking still needs a person.","tool":""}
  ]'::jsonb,
  '2026-05-30 09:15:00+05:30'
),
(
  'rahul.reception@demo.hope', 'hope', 'Rahul Verma', 'Front Office / Reception', '2026-05-30',
  '["Register walk-in patients","Answer phone enquiries","Collect and file consent forms","Direct visitors to departments"]'::jsonb,
  '[
    {"task":"Register walk-in patients","type":"reduce","suggestion":"Offer a self-service kiosk / pre-registration link for repeat patients.","rationale":"Shortens the front-desk queue.","tool":"Self check-in kiosk"},
    {"task":"Answer phone enquiries","type":"automate","suggestion":"Add an IVR + FAQ chatbot for timings, location, and report status.","rationale":"Deflects routine calls.","tool":"IVR / chatbot"},
    {"task":"Collect and file consent forms","type":"automate","suggestion":"Move to e-consent captured on a tablet and stored in the patient record.","rationale":"No paper filing or retrieval.","tool":"e-consent"},
    {"task":"Direct visitors to departments","type":"delegate","suggestion":"Add clear signage and a volunteer/guard at the entrance.","rationale":"Frees the desk for registration.","tool":""}
  ]'::jsonb,
  '2026-05-30 10:05:00+05:30'
),
(
  'anita.billing@demo.hope', 'hope', 'Anita Desai', 'Billing', '2026-05-30',
  '["Generate final bills at discharge","Reconcile cash counter at end of day","Follow up on pending insurance claims","Issue payment receipts"]'::jsonb,
  '[
    {"task":"Generate final bills at discharge","type":"automate","suggestion":"Auto-compile charges from services, pharmacy, and lab into the final bill.","rationale":"Reduces manual line-item entry.","tool":"Final Bill module"},
    {"task":"Reconcile cash counter at end of day","type":"automate","suggestion":"Use the system day-book/collection report instead of a manual tally.","rationale":"Reconciliation in minutes.","tool":"Cash Book report"},
    {"task":"Follow up on pending insurance claims","type":"reduce","suggestion":"Add a claims status dashboard with automatic ageing reminders.","rationale":"Stops manual tracking spreadsheets.","tool":"Claims tracker"},
    {"task":"Issue payment receipts","type":"automate","suggestion":"Auto-email/SMS the receipt PDF on payment.","rationale":"No manual printing for most patients.","tool":"Receipt auto-send"}
  ]'::jsonb,
  '2026-05-30 18:40:00+05:30'
),
-- ── Yesterday (2026-05-29) ──
(
  'suresh.lab@demo.hope', 'hope', 'Suresh Iyer', 'Laboratory', '2026-05-29',
  '["Log incoming test samples","Enter test results manually","Print and dispatch reports","Call doctors about critical values"]'::jsonb,
  '[
    {"task":"Log incoming test samples","type":"automate","suggestion":"Barcode each sample at collection and scan on arrival.","rationale":"Eliminates manual register entry.","tool":"Barcode / LIS"},
    {"task":"Enter test results manually","type":"automate","suggestion":"Interface analysers directly to the LIS to auto-post results.","rationale":"Removes transcription and typos.","tool":"Analyser interface (LIS)"},
    {"task":"Print and dispatch reports","type":"reduce","suggestion":"Default to digital report delivery via patient portal/WhatsApp.","rationale":"Less printing and courier.","tool":"Report portal"},
    {"task":"Call doctors about critical values","type":"keep","suggestion":"Keep the call, but trigger an auto-alert to the doctor first.","rationale":"Critical values need confirmed human contact.","tool":"Critical-value alert"}
  ]'::jsonb,
  '2026-05-29 11:20:00+05:30'
),
(
  'meena.pharma@demo.hope', 'hope', 'Meena Kulkarni', 'Pharmacy', '2026-05-29',
  '["Dispense prescriptions","Check medicine expiry on shelves","Raise purchase orders for low stock","Reconcile pharmacy sales"]'::jsonb,
  '[
    {"task":"Dispense prescriptions","type":"reduce","suggestion":"Pull e-prescriptions straight from the EMR instead of re-keying.","rationale":"Faster, fewer dispensing errors.","tool":"e-Prescription"},
    {"task":"Check medicine expiry on shelves","type":"automate","suggestion":"Track batch expiry in the system with a near-expiry alert report.","rationale":"No manual shelf scanning.","tool":"Inventory expiry report"},
    {"task":"Raise purchase orders for low stock","type":"automate","suggestion":"Auto-generate POs when stock hits reorder level.","rationale":"Prevents stock-outs without manual checks.","tool":"Auto reorder"},
    {"task":"Reconcile pharmacy sales","type":"automate","suggestion":"Use the daily pharmacy sales report for reconciliation.","rationale":"One-click instead of manual totals.","tool":"Pharmacy sales report"}
  ]'::jsonb,
  '2026-05-29 17:05:00+05:30'
),
(
  'vikram.admin@demo.hope', 'hope', 'Vikram Singh', 'Administration', '2026-05-29',
  '["Compile staff attendance","Schedule duty rosters","Approve leave requests","Prepare monthly MIS report"]'::jsonb,
  '[
    {"task":"Compile staff attendance","type":"automate","suggestion":"Use biometric/app attendance that feeds payroll automatically.","rationale":"No manual register compilation.","tool":"Biometric attendance"},
    {"task":"Schedule duty rosters","type":"reduce","suggestion":"Use a rota template that rolls over with edits instead of rebuilding.","rationale":"Saves weekly rebuild time.","tool":"Roster template"},
    {"task":"Approve leave requests","type":"automate","suggestion":"Move to a self-service leave workflow with approval routing.","rationale":"Removes paper and email back-and-forth.","tool":"Leave workflow"},
    {"task":"Prepare monthly MIS report","type":"automate","suggestion":"Auto-assemble MIS from dashboard metrics on a schedule.","rationale":"Report is generated, not authored.","tool":"Director Dashboard export"}
  ]'::jsonb,
  '2026-05-29 19:30:00+05:30'
),
-- ── Two days ago (2026-05-28) ──
(
  'deepa.marketing@demo.hope', 'hope', 'Deepa Nair', 'Marketing', '2026-05-28',
  '["Track daily referrals by source","Follow up with referring doctors","Update camp/event calendar","Compile lead conversion numbers"]'::jsonb,
  '[
    {"task":"Track daily referrals by source","type":"automate","suggestion":"Capture referral source at registration and read it from the dashboard.","rationale":"No manual tally per source.","tool":"Marketing Dashboard"},
    {"task":"Follow up with referring doctors","type":"reduce","suggestion":"Use a CRM cadence with templated thank-you/update messages.","rationale":"Consistent follow-up with less effort.","tool":"CRM templates"},
    {"task":"Update camp/event calendar","type":"keep","suggestion":"Keep manual, but share a single live calendar.","rationale":"Low volume, needs judgement.","tool":"Shared calendar"},
    {"task":"Compile lead conversion numbers","type":"automate","suggestion":"Derive conversion from referral-to-visit linkage automatically.","rationale":"Removes spreadsheet maintenance.","tool":"Marketing Dashboard"}
  ]'::jsonb,
  '2026-05-28 12:10:00+05:30'
),
(
  'farhan.it@demo.hope', 'hope', 'Farhan Khan', 'IT', '2026-05-28',
  '["Reset user passwords","Add new staff logins","Take database backups","Resolve printer/network tickets"]'::jsonb,
  '[
    {"task":"Reset user passwords","type":"automate","suggestion":"Enable self-service password reset.","rationale":"Removes the most common ticket type.","tool":"Self-service reset"},
    {"task":"Add new staff logins","type":"reduce","suggestion":"Use role-based templates so onboarding is a single form.","rationale":"Faster, consistent provisioning.","tool":"Role templates"},
    {"task":"Take database backups","type":"automate","suggestion":"Schedule automated daily backups with success alerts.","rationale":"No manual backup runs.","tool":"Scheduled backups"},
    {"task":"Resolve printer/network tickets","type":"keep","suggestion":"Keep, but route via a simple ticketing queue.","rationale":"Hands-on fixes still needed.","tool":"Helpdesk ticketing"}
  ]'::jsonb,
  '2026-05-28 15:45:00+05:30'
);
