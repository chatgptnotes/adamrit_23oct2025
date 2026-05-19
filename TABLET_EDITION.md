# Adamrit Tablet Edition — Working Notes

A touch-first "tablet view" of the Adamrit hospital app, served at **`/t`**. Same
Supabase backend as the desktop site — just a separate, simplified, big-button UI
for staff using tablets.

_Last updated: 2026-05-18._

---

## ▶️ Start here tomorrow

```bash
cd /Users/apple/Desktop/adarith/adamrit
npm run dev
```

Vite prints the URL. It uses the first free port from 8080 (today it landed on **8083**).

| Open | URL |
|------|-----|
| 📱 Tablet edition | `http://localhost:<port>/t` |
| 📱 From another laptop/tablet on same Wi-Fi | `http://<this-mac-ip>:<port>/t` |
| 🖥️ Desktop site (unchanged) | `http://localhost:<port>/` |

To find this Mac's Wi-Fi IP: `ipconfig getifaddr en0`.

### Logging in (PIN only)
1. First open → **device setup** → pick the hospital → Save & Continue.
2. **Staff grid** → tap a name → **4-digit PIN**.
3. Test account already created: **`test@hopehospital.com`** · hospital **Hope** · PIN **`1234`** · role admin (sees all 12 tiles).

To give another staff member a tablet PIN, run in the Supabase SQL editor:
```sql
update "User" set staff_pin = '1234' where email ilike 'someone@example.com';
```
PINs must be unique within a hospital.

---

## ✅ What is built

### Foundation
- `/t` route namespace, its own shell (no desktop sidebar), PIN auth gate, device provisioning, role-filtered home grid, shared flow scaffold + numeric keypad + patient picker.

### 12 modules (all live under `src/tablet/modules/`)
Register Patient · Bed Occupancy · ICU Admission · Advance Statement · Requisition ·
Gate Pass · Discharge Summary · Discharged Patients · DAMA/LAMA · Billing ·
Cash in Hand · Reports.

### Register Patient — fully rebuilt
- Captures the **full website registration field set** (~28 fields) in 4 sections:
  Patient information · Address · Emergency contacts · Additional information.
- Laid out as a **compact multi-column grid** ("table view") — 3 fields per row.
- Creates a real **patient + visit** with **OPD / IPD / Emergency** patient type;
  IPD/Emergency get a ward + bed step (free beds only).
- Uses the real hospital ID generators (`UHHO24L09001` patient IDs, `IH…` visit IDs).
- Writes `patients` + `visits` + `patient_data`. **INSERT-only — never edits/deletes existing data.**

### Patient type everywhere
- Admitted/occupancy lists now include **Emergency** patients (not just IPD).
- OPD / IPD / Emergency colour badge on cards across the lists.

### Look & feel
- "Luxury" polish: gradient background, elevated cards with hover lift, gradient
  greeting banner + gradient module-tile icons, frosted top/bottom bars.

---

## 🗂️ Where the code lives

```
src/tablet/                     ← the whole tablet edition
  TabletApp.tsx                 ← entry point (mounted at /t/*)
  config/modules.ts             ← the 12 module tiles
  styles/tablet.css             ← scoped styling + premium polish
  shell/                        ← TabletShell, TabletTopBar, SyncIndicator
  auth/                         ← TabletLogin, StaffGrid, PinKeypad, DeviceProvisioning
  screens/                      ← TabletHome, TabletModuleHost
  components/                   ← FlowScaffold, TabletPatientPicker, TabletNumpad, …
  ui/                           ← TabletButton, TabletInput, TabletCard
  hooks/                        ← useTabletDevice, useTabletStaff, useVisitLists, …
  modules/<name>/               ← one folder per module

Wiring into the desktop app (only 3 files, all additive):
  src/App.tsx                   ← /t skips the desktop landing/login
  src/components/AppRoutes.tsx  ← /t/* lazy route
  src/contexts/AuthContext.tsx  ← PIN login generalised to both hospitals

Shared logic extracted (used by desktop + tablet):
  src/utils/visitIdGenerator.ts   ← visit-ID generator
  src/utils/patientIdGenerator.ts ← patient-ID generator (already existed, reused)
  src/hooks/usePatientLookup.ts   ← patient search
  src/hooks/useOccupancy.ts       ← live bed occupancy
```

---

## ⏳ Not done yet / next steps

- **Other 11 modules are still the simple v1 versions.** Only Register was deepened
  to full website parity (you chose "patient-type + key gaps only").
- **Patient photo / document upload** is not in tablet Register — it needs Supabase
  Storage wiring. Easy to add as a camera-capture step if wanted.
- **Shared-hook extraction** for the other write modules (Advance, Requisition,
  DAMA, ICU Admission, Billing) is pending — they currently do direct inserts that
  mirror the desktop column shapes. Consolidating prevents tablet/desktop drift.
- Deeper parity options if wanted: structured discharge-summary editor, gate-pass
  generation, full billing.
- Optional: a **dark "premium" theme**.

---

## 🔒 Rules / constraints

- **`src/pages/FinalBill.tsx` is SHA256-locked** — never edit/import it. Verify with
  `npm run check:finalbill`.
- **No mock data** — every screen uses real Supabase data.
- Tablet Register is **INSERT-only** — it creates new rows, never changes existing data.
- All queries are hospital-scoped (`hospital_name`).

---

## 🧪 Verify before shipping

```bash
npm run build            # must succeed
npm run check:finalbill  # must say "FinalBill.tsx unchanged"
npm run lint             # 0 errors (some pre-existing `any` warnings are fine)
```

Then in the browser: register an OPD, an IPD (with ward/bed), and an Emergency
patient on `/t`, and confirm each appears in the desktop site.

---

## 🧭 Backlog — to build tomorrow

### New modules to add to the tablet

**1. Doctor Notes** ✅ DONE — now a 3-in-1 hub (2026-05-19)
Pick an admitted visit → menu of 3 cards:
- **Admission Notes** — the 11-field clinical write-up; reads/writes
  `visits.ipd_admission_notes` (same column as the desktop, stays in sync).
- **Progress Notes** — daily clinical notes, **append-only**, stored as a JSONB
  list in `ipd_discharge_summary.daily_progress_notes`; shown newest-first.
- **Treatment Sheet** — medication-chart **table** (# · Medication · Dose · Route
  · Frequency · Duration · **Availability**) + daily-plan table + Print.
  **Add medication** searches the live **pharmacy catalogue** (`medicine_master`
  — ~1,100 drugs) and shows each medicine's stock — green *In stock* / amber
  *Low* / red *Out of stock*, summed from `medicine_batch_inventory`. Saves
  INSERT-only into `visit_medications` via `addMedications`. Pharmacy tables are
  read-only (no stock deducted).
- **🎙️ Voice dictation** — note fields have a single **Dictate** button, no
  language toggle: Indian-English recognition (`en-IN`) auto-handles English and
  mixed English/Hindi (Hinglish), with **live transcription** (words appear as
  you speak; sentences auto-capitalised). Free browser Web Speech API; hidden
  where unsupported. _Limitation:_ the free browser engine can't auto-detect a
  separate language, so pure Hindi-script dictation needs a paid cloud speech
  service (Google STT `alternativeLanguageCodes`) — a future option.

Files: `src/tablet/modules/doctor-notes/{DoctorNotesFlow,AdmissionNotes,ProgressNotes,TreatmentSheet}.tsx`,
`src/tablet/hooks/useSpeechToText.ts`, `src/tablet/components/DictationTextarea.tsx`.

⚠️ **One-time DB step for Progress Notes** — if `ipd_discharge_summary.daily_progress_notes`
isn't live yet, run once in the Supabase SQL editor (additive, harms nothing):
```sql
alter table ipd_discharge_summary
  add column if not exists daily_progress_notes jsonb default '[]'::jsonb;
```

**Medication Round (MAR)** ✅ DONE (2026-05-19) — new home-grid tile (pink).
Nurse picks an admitted patient → marks each dose **given / missed**, or adds a
dose. All writes go ONLY into a brand-new `medication_administration` table;
`visit_medications` and every other table are untouched.
File: `src/tablet/modules/medication-round/MedicationRoundFlow.tsx`.

⚠️ **One-time DB step for Medication Round** — run once in the Supabase SQL editor
(creates a brand-new table; changes no existing data). The screen shows this SQL
itself until the table exists:
```sql
create table if not exists medication_administration (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid, patient_id uuid, prescription_item_id uuid,
  medication_name text not null, dose text, route text, frequency text,
  scheduled_time timestamptz, administered_at timestamptz, administered_by text,
  status text not null default 'pending', missed_reason text, notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
```

**2. Complaints (Chief / Presenting Complaints)** 🔜
- Capture the patient's complaints / symptoms for a visit — what they came in for.
- This is the same data the discharge summary already uses
  (`ipd_discharge_summary.chief_complaints`), so it feeds straight into discharge.
- Flow: pick a visit → add/edit the list of complaints → save.
- New folder `src/tablet/modules/complaints/`; tile + route same as above.
- TODO tomorrow: confirm where complaints are stored (visit field vs own table).

**3. (more ideas — add here)**
- _e.g._ vitals capture, medication chart, lab/radiology results view…

### How to add any new module (checklist)
1. Create `src/tablet/modules/<name>/<Name>Flow.tsx` with a `default` export.
2. Add an entry to `TABLET_MODULES` in `src/tablet/config/modules.ts` (icon, label, tint).
3. Add the lazy import in `src/tablet/screens/TabletModuleHost.tsx`.
4. Reuse `FlowScaffold`, `TabletPatientPicker` / `TabletVisitList`, `TabletCard`.
5. Real Supabase data only — no mock data.

### Testing / ops checklist
- [x] Build the Doctor Notes module. ✅ (2026-05-19)
- [ ] Build the Complaints module.
- [ ] Test all module tiles on a real tablet; note anything that errors.
- [ ] Assign tablet PINs to the real staff who will use the device.
- [ ] Decide: add patient photo capture to Register? add a dark theme?
- [ ] Decide which of the other simple modules to deepen next (Billing? Discharge summary?).
