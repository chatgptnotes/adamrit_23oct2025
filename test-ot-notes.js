// Test script to verify OT notes data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOTNotes() {
  console.log('Testing OT Notes Data...\n');

  // 1. Get all OT notes
  const { data: allNotes, error: allError } = await supabase
    .from('ot_notes')
    .select('*');

  if (allError) {
    console.error('Error fetching OT notes:', allError);
    return;
  }

  console.log(`Found ${allNotes?.length || 0} OT notes in database`);

  if (allNotes && allNotes.length > 0) {
    console.log('\nFirst OT Note:');
    console.log('- Visit ID:', allNotes[0].visit_id);
    console.log('- Patient ID:', allNotes[0].patient_id);
    console.log('- Patient Name:', allNotes[0].patient_name);
    console.log('- Surgery Name:', allNotes[0].surgery_name);
    console.log('- Surgeon:', allNotes[0].surgeon);
    console.log('- Anaesthetist:', allNotes[0].anaesthetist);
    console.log('- Anaesthesia:', allNotes[0].anaesthesia);
    console.log('- Implant:', allNotes[0].implant);
  }

  // 2. Get all visits to check linking
  const { data: visits, error: visitError } = await supabase
    .from('visits')
    .select('id, patient_id')
    .limit(5);

  if (!visitError && visits) {
    console.log(`\nFound ${visits.length} visits`);
    console.log('First few visit IDs:', visits.map(v => v.id).slice(0, 3));
  }

  // 3. Test joining visits with OT notes
  const { data: joinedData, error: joinError } = await supabase
    .from('visits')
    .select(`
      id,
      patient_id,
      ot_notes (
        surgery_name,
        surgeon,
        anaesthetist,
        anaesthesia,
        implant
      )
    `)
    .limit(5);

  if (!joinError && joinedData) {
    console.log('\n=== Visits with OT Notes ===');
    joinedData.forEach(visit => {
      console.log(`Visit ${visit.id}:`, visit.ot_notes ? 'Has OT notes' : 'No OT notes');
    });
  }
}

testOTNotes().catch(console.error);