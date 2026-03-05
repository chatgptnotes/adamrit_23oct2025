const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xvkxccqaopbnkvwgyfjv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU'
);

async function check() {
  // Check recent meetings
  const { data: meetings, error: e1 } = await supabase
    .from('corporate_area_meetings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log('Recent meetings:', meetings?.length || 0);
  if (meetings) meetings.forEach(m => console.log(m));
  if (e1) console.log('Meetings error:', e1.message);
  
  // Check corporates
  const { data: corps } = await supabase
    .from('corporate_master')
    .select('id, name')
    .ilike('name', '%wcl%');
  console.log('\nWCL corporates:', corps);
  
  // Check areas
  const { data: areas } = await supabase
    .from('corporate_areas')
    .select('id, area_name, corporate_id')
    .ilike('area_name', '%ballar%');
  console.log('Ballarpur areas:', areas);
}

check();
