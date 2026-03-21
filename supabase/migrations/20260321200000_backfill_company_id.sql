-- Backfill company_id from company_name in all tally data tables
UPDATE tally_ledgers SET company_id = tc.id FROM tally_config tc WHERE tally_ledgers.company_name = tc.company_name AND tally_ledgers.company_id IS NULL;
UPDATE tally_vouchers SET company_id = tc.id FROM tally_config tc WHERE tally_vouchers.company_name = tc.company_name AND tally_vouchers.company_id IS NULL;
UPDATE tally_stock_items SET company_id = tc.id FROM tally_config tc WHERE tally_stock_items.company_name = tc.company_name AND tally_stock_items.company_id IS NULL;
UPDATE tally_groups SET company_id = tc.id FROM tally_config tc WHERE tally_groups.company_name = tc.company_name AND tally_groups.company_id IS NULL;
UPDATE tally_cost_centres SET company_id = tc.id FROM tally_config tc WHERE tally_cost_centres.company_name = tc.company_name AND tally_cost_centres.company_id IS NULL;
UPDATE tally_bank_statements SET company_id = tc.id FROM tally_config tc WHERE tally_bank_statements.company_name = tc.company_name AND tally_bank_statements.company_id IS NULL;
UPDATE tally_gst_data SET company_id = tc.id FROM tally_config tc WHERE tally_gst_data.company_name = tc.company_name AND tally_gst_data.company_id IS NULL;
UPDATE tally_reports SET company_id = tc.id FROM tally_config tc WHERE tally_reports.company_name = tc.company_name AND tally_reports.company_id IS NULL;
UPDATE tally_sync_log SET company_id = tc.id FROM tally_config tc WHERE tally_sync_log.company_name = tc.company_name AND tally_sync_log.company_id IS NULL;
UPDATE tally_push_queue SET company_id = tc.id FROM tally_config tc WHERE tally_push_queue.company_name = tc.company_name AND tally_push_queue.company_id IS NULL;
UPDATE tally_ledger_mapping SET company_id = tc.id FROM tally_config tc WHERE tally_ledger_mapping.company_name = tc.company_name AND tally_ledger_mapping.company_id IS NULL;
