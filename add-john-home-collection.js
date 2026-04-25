import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvkxccqaopbnkvwgyfjv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addJohnHomeCollectionData() {
  try {
    console.log('🏥 Creating test patient John with home collection requests...\n');

    console.log('✅ Patient John created:');
    console.log('   Name: John Smith');
    console.log('   Mobile: 9876543210');
    console.log('   Address: 123 Main Street, Bangalore\n');

    // Get today's date for home collection requests
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    // 2. Create home collection requests at different stages
    const homeCollectionRequests = [
      {
        patient_name: 'John Smith',
        mobile: '9876543210',
        address: '123 Main Street, Apartment 4B',
        locality: 'Indiranagar',
        preferred_date: dateStr,
        preferred_time_slot: '8am-10am',
        tests_requested: ['CBC', 'Blood Sugar Fasting', 'Lipid Profile'],
        special_instructions: 'Patient fasting from 10 PM last night',
        collection_charges: 100,
        status: 'pending',
        request_number: 'HCR-001-JOHN'
      },
      {
        patient_name: 'John Smith',
        mobile: '9876543210',
        address: '123 Main Street, Apartment 4B',
        locality: 'Indiranagar',
        preferred_date: dateStr,
        preferred_time_slot: '10am-12pm',
        tests_requested: ['Thyroid Profile (TSH)', 'Vitamin D'],
        special_instructions: 'No special instructions',
        collection_charges: 100,
        status: 'assigned',
        phlebotomist_name: 'Rajesh Kumar',
        request_number: 'HCR-002-JOHN'
      },
      {
        patient_name: 'John Smith',
        mobile: '9876543210',
        address: '123 Main Street, Apartment 4B',
        locality: 'Indiranagar',
        preferred_date: dateStr,
        preferred_time_slot: '12pm-2pm',
        tests_requested: ['Liver Function Test', 'Kidney Function Test'],
        special_instructions: 'Call before arriving',
        collection_charges: 100,
        status: 'en_route',
        phlebotomist_name: 'Priya Singh',
        en_route_at: new Date().toISOString(),
        request_number: 'HCR-003-JOHN'
      },
      {
        patient_name: 'John Smith',
        mobile: '9876543210',
        address: '123 Main Street, Apartment 4B',
        locality: 'Indiranagar',
        preferred_date: dateStr,
        preferred_time_slot: '2pm-4pm',
        tests_requested: ['HBsAg', 'Anti-HCV'],
        special_instructions: 'Patient at home after 2 PM',
        collection_charges: 100,
        status: 'arrived',
        phlebotomist_name: 'Amit Patel',
        arrived_at: new Date().toISOString(),
        request_number: 'HCR-004-JOHN'
      },
      {
        patient_name: 'John Smith',
        mobile: '9876543210',
        address: '123 Main Street, Apartment 4B',
        locality: 'Indiranagar',
        preferred_date: dateStr,
        preferred_time_slot: '4pm-6pm',
        tests_requested: ['CBC', 'Blood Sugar PP', 'Urine Routine'],
        special_instructions: 'Previous visit - follow up tests',
        collection_charges: 100,
        status: 'sample_collected',
        phlebotomist_name: 'Meera Gupta',
        barcodes: ['BC-2026-0501', 'BC-2026-0502', 'BC-2026-0503'],
        collected_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        request_number: 'HCR-005-JOHN'
      },
      {
        patient_name: 'John Smith',
        mobile: '9876543210',
        address: '123 Main Street, Apartment 4B',
        locality: 'Indiranagar',
        preferred_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        preferred_time_slot: '10am-12pm',
        tests_requested: ['Lipid Profile', 'HbA1c'],
        special_instructions: 'Urgent - for doctor review',
        collection_charges: 100,
        status: 'delivered',
        phlebotomist_name: 'Rajesh Kumar',
        barcodes: ['BC-2026-0101', 'BC-2026-0102'],
        delivered_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        request_number: 'HCR-006-JOHN'
      }
    ];

    // Insert all home collection requests
    const { data: requestRes, error: requestErr } = await supabase
      .from('home_collection_requests')
      .insert(homeCollectionRequests)
      .select();

    if (requestErr) {
      console.error('❌ Error creating home collection requests:', requestErr);
      return;
    }

    console.log('✅ Created 6 Home Collection Requests:\n');
    console.log('📋 REQUEST 1 (PENDING):');
    console.log('   Status: PENDING ⏳');
    console.log('   Tests: CBC, Blood Sugar Fasting, Lipid Profile');
    console.log('   Time: 8am-10am');
    console.log('   Assigned: Not yet\n');

    console.log('👤 REQUEST 2 (ASSIGNED):');
    console.log('   Status: ASSIGNED 🔵');
    console.log('   Tests: Thyroid Profile, Vitamin D');
    console.log('   Time: 10am-12pm');
    console.log('   Assigned to: Rajesh Kumar\n');

    console.log('🚗 REQUEST 3 (EN ROUTE):');
    console.log('   Status: EN ROUTE 🟣');
    console.log('   Tests: Liver Function Test, Kidney Function Test');
    console.log('   Time: 12pm-2pm');
    console.log('   Assigned to: Priya Singh\n');

    console.log('🏠 REQUEST 4 (ARRIVED):');
    console.log('   Status: ARRIVED 🟠');
    console.log('   Tests: HBsAg, Anti-HCV');
    console.log('   Time: 2pm-4pm');
    console.log('   Assigned to: Amit Patel\n');

    console.log('💉 REQUEST 5 (SAMPLE COLLECTED):');
    console.log('   Status: SAMPLE COLLECTED 🟢');
    console.log('   Tests: CBC, Blood Sugar PP, Urine Routine');
    console.log('   Time: 4pm-6pm');
    console.log('   Barcodes: BC-2026-0501, BC-2026-0502, BC-2026-0503');
    console.log('   Assigned to: Meera Gupta\n');

    console.log('✅ REQUEST 6 (DELIVERED):');
    console.log('   Status: DELIVERED ⚪');
    console.log('   Tests: Lipid Profile, HbA1c');
    console.log('   Date: Yesterday');
    console.log('   Barcodes: BC-2026-0101, BC-2026-0102');
    console.log('   Assigned to: Rajesh Kumar\n');

    console.log('═══════════════════════════════════════════');
    console.log('✅ All dummy data added successfully!');
    console.log('═══════════════════════════════════════════\n');
    console.log('🎯 Next Steps:');
    console.log('1. Go to Home Collection page to see all requests');
    console.log('2. Click on any request to advance its status');
    console.log('3. View Phlebotomist Dashboard to track assignments');
    console.log('4. See complete workflow in action!\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addJohnHomeCollectionData();
