// Starter task lists per department, so staff don't begin from a blank box.
// Clicking a chip appends the task to the textarea. Keys match the
// DESIGNATION_OPTIONS labels used in the entry form.
export const COMMON_TASKS: Record<string, string[]> = {
  Nursing: [
    'Enter patient vitals into the system',
    'Administer and chart medications',
    'Prepare daily census report',
    'Restock ward medicine trolley',
  ],
  Billing: [
    'Generate final bills at discharge',
    'Reconcile cash counter at end of day',
    'Follow up on pending insurance claims',
    'Issue payment receipts',
  ],
  Pharmacy: [
    'Dispense prescriptions',
    'Check medicine expiry on shelves',
    'Raise purchase orders for low stock',
    'Reconcile pharmacy sales',
  ],
  Laboratory: [
    'Log incoming test samples',
    'Enter test results manually',
    'Print and dispatch reports',
    'Call doctors about critical values',
  ],
  Radiology: [
    'Schedule scan appointments',
    'Enter radiology findings',
    'Dispatch imaging reports',
    'Maintain the scan worklist',
  ],
  'Front Office / Reception': [
    'Register walk-in patients',
    'Answer phone enquiries',
    'Collect and file consent forms',
    'Direct visitors to departments',
  ],
  Administration: [
    'Compile staff attendance',
    'Schedule duty rosters',
    'Approve leave requests',
    'Prepare monthly MIS report',
  ],
  Marketing: [
    'Track daily referrals by source',
    'Follow up with referring doctors',
    'Update camp/event calendar',
    'Compile lead conversion numbers',
  ],
  IT: [
    'Reset user passwords',
    'Add new staff logins',
    'Take database backups',
    'Resolve printer/network tickets',
  ],
  Accounts: [
    'Post daily vouchers',
    'Reconcile bank statements',
    'Track vendor payments',
    'Prepare ledger statements',
  ],
  Finance: [
    'Review daily collections',
    'Track outstanding receivables',
    'Prepare cash-flow summary',
    'Compile expense reports',
  ],
};

// Adamrit modules the AI can point staff to as "available now" instant wins.
// Surfaced in the optimize prompt so suggested tools map to features that
// already exist in this app rather than generic external software.
export const ADAMRIT_MODULES: string[] = [
  'Final Bill module (auto-compiles charges)',
  'Cash Book and Day Book reports',
  'Tally integration (accounting sync)',
  'IPD / OPD dashboards and census reports',
  'Lab and Radiology worklists',
  'Report Delivery (WhatsApp/portal)',
  'Telephony / Twilio calling and IVR',
  'Self check-in kiosk and Patient Portal',
  'Staff Attendance',
  'Payment QR and receipt auto-send',
  'Marketing Dashboard and incentives',
  'Director Dashboard (MIS export)',
];
