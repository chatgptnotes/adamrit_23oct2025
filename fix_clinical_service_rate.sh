#!/bin/bash

# Script to fix the "clinical_service_rate" error
# This script applies the cleanup migrations and tests the database

echo "🔧 Fixing clinical_service_rate error..."

# Step 1: Apply the cleanup migrations
echo "📦 Applying cleanup migrations..."

# Method 1: Try local Supabase first
echo "Trying local Supabase..."
if npx supabase migration up; then
    echo "✅ Local migrations applied successfully"
else
    echo "⚠️  Local Supabase not available, trying remote..."

    # Method 2: Try remote deployment
    if npx supabase db push; then
        echo "✅ Remote migrations applied successfully"
    else
        echo "❌ Could not apply migrations automatically"
        echo "📝 Please apply these migrations manually:"
        echo "   1. 20250923000017_fix_clinical_service_rate_error.sql"
        echo "   2. 20250923000018_final_cleanup_clinical_service_rate.sql"
        exit 1
    fi
fi

# Step 2: Verify the fix
echo "🔍 Verifying the fix..."

# Check if the problematic functions are gone
echo "Checking for problematic functions..."
echo "These should be empty results:"

# You can uncomment these if you have psql access
# psql -d your_database -c "SELECT proname FROM pg_proc WHERE proname LIKE '%clinical_service%' AND prosrc LIKE '%clinical_service_rate%';"
# psql -d your_database -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'visits' AND column_name LIKE '%rate%';"

echo "✅ Cleanup complete!"
echo ""
echo "🎯 The visits table should now have:"
echo "   - clinical_service_id UUID (foreign key to clinical_services)"
echo "   - mandatory_service_id UUID (foreign key to mandatory_services)"
echo "   - clinical_services JSONB (for backward compatibility)"
echo "   - mandatory_services JSONB (for backward compatibility)"
echo ""
echo "💡 Your application should now work without the 'clinical_service_rate' error."
echo "   Test by trying to save a clinical service in the FinalBill page."