SELECT 
  vms.id,
  vms.visit_id,
  vms.mandatory_service_id,
  vms.rate_used,
  vms.amount,
  vms.rate_type,
  ms.service_name,
  ms.private_rate,
  ms.tpa_rate,
  v.visit_id as visit_code,
  v.patient_type,
  p.category as patient_category
FROM visit_mandatory_services vms
JOIN mandatory_services ms ON vms.mandatory_service_id = ms.id
JOIN visits v ON vms.visit_id = v.id
JOIN patients p ON v.patient_id = p.id
ORDER BY vms.id DESC
LIMIT 5;
