-- ============================================================
-- Item 4: ESIC / Insurance Specific Ledger Mappings
-- ============================================================
-- Run this in Supabase SQL Editor

INSERT INTO tally_ledger_mapping (adamrit_entity_type, adamrit_entity_name, tally_ledger_name, tally_group) VALUES
-- Insurance/TPA mappings
('insurance', 'ESIC', 'ESIC Receivables', 'Sundry Debtors'),
('insurance', 'CGHS', 'CGHS Receivables', 'Sundry Debtors'),
('insurance', 'Star Health', 'Star Health Insurance Receivables', 'Sundry Debtors'),
('insurance', 'ICICI Lombard', 'ICICI Lombard Insurance Receivables', 'Sundry Debtors'),
('insurance', 'New India Assurance', 'New India Assurance Receivables', 'Sundry Debtors'),
('insurance', 'United India Insurance', 'United India Insurance Receivables', 'Sundry Debtors'),
('insurance', 'National Insurance', 'National Insurance Receivables', 'Sundry Debtors'),
('insurance', 'Oriental Insurance', 'Oriental Insurance Receivables', 'Sundry Debtors'),
('insurance', 'Bajaj Allianz', 'Bajaj Allianz Insurance Receivables', 'Sundry Debtors'),
('insurance', 'HDFC Ergo', 'HDFC Ergo Insurance Receivables', 'Sundry Debtors'),
('insurance', 'Max Bupa', 'Max Bupa Insurance Receivables', 'Sundry Debtors'),
('insurance', 'Religare', 'Religare Insurance Receivables', 'Sundry Debtors'),
('insurance', 'Other TPA', 'TPA Receivables - Others', 'Sundry Debtors'),

-- ESIC-specific income heads
('esic_income', 'ESIC Consultation', 'ESIC Income - Consultation', 'Direct Incomes'),
('esic_income', 'ESIC IPD', 'ESIC Income - IPD', 'Direct Incomes'),
('esic_income', 'ESIC OPD', 'ESIC Income - OPD', 'Direct Incomes'),
('esic_income', 'ESIC Surgery', 'ESIC Income - Surgery', 'Direct Incomes'),
('esic_income', 'ESIC Lab', 'ESIC Income - Lab', 'Direct Incomes'),
('esic_income', 'ESIC Pharmacy', 'ESIC Income - Pharmacy', 'Direct Incomes'),

-- Insurance claim status tracking (expense side for disallowances)
('insurance_expense', 'TPA Deduction', 'TPA Deductions', 'Indirect Expenses'),
('insurance_expense', 'Insurance Disallowance', 'Insurance Disallowance', 'Indirect Expenses'),
('insurance_expense', 'Insurance Write-off', 'Insurance Bad Debts Written Off', 'Indirect Expenses')

ON CONFLICT (adamrit_entity_type, adamrit_entity_name) DO NOTHING;
