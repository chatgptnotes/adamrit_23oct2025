---
name: FinalBill page is locked
description: The /final-bill/:visitId page (src/pages/FinalBill.tsx) is feature-frozen. Do NOT modify the file, its layout, its financial-summary card, the External Requisition / Investigations tabs, the Advance Payment / Yojna Bill / Final Payment / Detailed Invoice buttons, or the printed FINAL BILL preview unless the user explicitly says "change FinalBill.tsx" or "modify the final bill page".
source_project: adamrit
tags: [project-lock, frozen-page, billing, finalbill, do-not-touch]
---

# FinalBill page is locked

## The Rule

**`src/pages/FinalBill.tsx` (route `/final-bill/:visitId`) is frozen.** Do not edit, refactor, reformat, "clean up", add comments to, or change behavior in this file. Treat it as read-only for the purpose of suggestions and edits unless the user explicitly authorizes a change to it.

This rule also applies to the visible structure of the page in the screenshot:

- Left sidebar layout (Dashboard, Patient Selection, IPD Dashboard, etc.)
- The **Investigations** tabbed panel (Laboratory Services, Radiology, Pharmacy, Implant, Mandatory Services)
- The **External Requisition** table
- The **Financial Summary** card (Date, Save Package, Save Financial Summary, Apply Discount, Refresh Data, Total Amount / Discount / Amount Paid / Refunded Amount / Final Balance / Balance rows)
- The action buttons row: **Advance Payment**, **Yojna Bill**, **Final Payment**, **Detailed Invoice**
- The bottom **FINAL BILL** print preview block (insurer header, Claim ID, Bill No, Registration No, Patient name/age, etc.)

## When to activate

Activate this skill whenever you are about to:

- Edit `src/pages/FinalBill.tsx` directly
- Edit a component or hook whose change would visibly alter the /final-bill page — including `src/hooks/useFinalBillData.ts`, `src/components/patient/tabs/FinalBillTab.tsx`, or `src/components/patient/tabs/EditableFinalBillTab.tsx`
- "Refactor", "clean up", "improve", or "reformat" anything in or imported by that file
- Apply a sweeping codebase-wide change (lint fixes, style migrations, renames, dependency upgrades) that would touch `FinalBill.tsx` as part of a bulk edit
- Move/rename routes or files that would break `/final-bill/:visitId`

## Required behavior when activated

1. **STOP before touching the file.** Do not make the edit.
2. **Tell the user explicitly:** *"You've previously asked that the Final Bill page stay unchanged. The change I was about to make would modify `src/pages/FinalBill.tsx` (lines X–Y) because [reason]. Should I proceed anyway, work around it, or skip this entirely?"*
3. **Wait for explicit confirmation** containing words like "yes change it", "modify FinalBill", "go ahead and update final bill", or similar. A vague "ok" or general "fix the bug" is NOT sufficient.
4. **If the user does not authorize the change**, find a way to deliver the requested outcome WITHOUT modifying the protected file (e.g., wrap the component, add a parallel route, create a new page, or decline the change with an explanation).

## What is NOT locked

These adjacent pages are NOT covered by this rule and can be edited normally:

- `src/pages/EditFinalBill.tsx` (the `/edit-final-bill/:visitId` route — a separate editor)
- `src/pages/FinalBillTest.tsx` (test/preview page)
- New files you create that import from FinalBill (as long as FinalBill.tsx itself is untouched)

## Why this rule exists

The Final Bill page is a financially-sensitive, customer-facing artifact: it drives billing totals, insurer claim payloads, advance payments, and printed invoices for ACKO Insurance India and other corporates. Even visually-equivalent refactors carry regression risk (FinalBill.tsx is ~24,800 lines and has many implicit invariants). The user has chosen to freeze the page to eliminate that risk while other parts of the app are still in flux.

## Anti-patterns to avoid

- "I'll just clean up this one function" → No. Even single-line edits to FinalBill.tsx need explicit authorization.
- "I'll rename this prop everywhere in the codebase" → Skip FinalBill.tsx from the sweep, or ask first.
- "The user said fix the bug, the bug is in FinalBill" → Ask first; offer alternatives (e.g., fix it in a hook that FinalBill consumes, if possible).
- "I'll just reformat the imports" → No. The file is frozen including whitespace.
