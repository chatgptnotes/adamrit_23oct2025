// Alternative approach: Match lab results by patient name or any available criteria
// Since visit_id in lab_results is UUID and we have string visit_id "IH25F25001"

// For immediate testing, you can run this in browser console on the page:

// Option 1: Match by patient name if available
const fetchLabResultsByPatientName = async (patientName) => {
  try {
    const { data } = await supabase
      .from('lab_results')
      .select('*')
      .ilike('patient_name', `%${patientName}%`)
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('Lab results by patient name:', data);
    return data;
  } catch (error) {
    console.error('Error fetching by patient name:', error);
  }
};

// Option 2: Get recent lab results (for demo)
const getRecentLabResults = async () => {
  try {
    const { data } = await supabase
      .from('lab_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('Recent lab results:', data);
    return data;
  } catch (error) {
    console.error('Error fetching recent results:', error);
  }
};

// Option 3: Try to find by UUID if we can map visit_id string to UUID
const findVisitUUID = async (visitIdString) => {
  try {
    const { data: visitData } = await supabase
      .from('visits')
      .select('id')
      .eq('visit_id', visitIdString)
      .single();

    if (visitData) {
      const { data: labData } = await supabase
        .from('lab_results')
        .select('*')
        .eq('visit_id', visitData.id);

      console.log('Lab results by UUID mapping:', labData);
      return labData;
    }
  } catch (error) {
    console.error('Error mapping visit ID:', error);
  }
};

// Usage examples:
// fetchLabResultsByPatientName('Test Patient');
// getRecentLabResults();
// findVisitUUID('IH25F25001');