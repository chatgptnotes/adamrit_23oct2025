-- B2B partner portal login (code + pin)
alter table b2b_partners
  add column if not exists login_pin text;

-- Bill → queue auto-split function
-- Called manually from billing UI: pass visit_id, auto-creates queue tokens
create or replace function auto_queue_from_bill(p_visit_id uuid, p_patient_name text)
returns integer language plpgsql as $$
declare
  v_has_lab boolean;
  v_has_radiology boolean;
  v_has_pharmacy boolean;
  v_tokens_created integer := 0;
  v_next integer;
begin
  -- Check what services this visit has
  select exists(select 1 from lab_results where visit_id = p_visit_id limit 1) into v_has_lab;
  select exists(select 1 from radiology_orders where visit_id = p_visit_id limit 1) into v_has_radiology;
  select exists(select 1 from medications where visit_id = p_visit_id limit 1) into v_has_pharmacy;

  if v_has_lab then
    select next_queue_token('Lab') into v_next;
    insert into queue_tokens (token_number, department, patient_name, status, notes)
    values (v_next, 'Lab', p_patient_name, 'waiting', 'Auto from bill');
    v_tokens_created := v_tokens_created + 1;
  end if;

  if v_has_radiology then
    select next_queue_token('Radiology') into v_next;
    insert into queue_tokens (token_number, department, patient_name, status, notes)
    values (v_next, 'Radiology', p_patient_name, 'waiting', 'Auto from bill');
    v_tokens_created := v_tokens_created + 1;
  end if;

  if v_has_pharmacy then
    select next_queue_token('Pharmacy') into v_next;
    insert into queue_tokens (token_number, department, patient_name, status, notes)
    values (v_next, 'Pharmacy', p_patient_name, 'waiting', 'Auto from bill');
    v_tokens_created := v_tokens_created + 1;
  end if;

  -- Always create billing queue token
  select next_queue_token('Billing') into v_next;
  insert into queue_tokens (token_number, department, patient_name, status, notes)
  values (v_next, 'Billing', p_patient_name, 'waiting', 'Auto from bill');
  v_tokens_created := v_tokens_created + 1;

  return v_tokens_created;
end;
$$;
