#!/bin/bash
# WhatsApp Admission Reminder Deployment Script

echo "🚀 Deploying WhatsApp Admission Reminder System..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "❌ Supabase CLI is not installed."
    echo "📥 Install it from: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Step 1: Apply database migrations
echo "📊 Step 1: Applying database migrations..."
supabase db push
if [ $? -ne 0 ]; then
    echo "❌ Failed to apply migrations. Please check your Supabase connection."
    exit 1
fi
echo "✅ Database migrations applied"
echo ""

# Step 2: Set environment variables
echo "🔐 Step 2: Setting environment variables..."
echo "Please enter your Double Tick API Key (or press Enter to skip):"
read -r API_KEY

if [ -n "$API_KEY" ]; then
    supabase secrets set DOUBLETICK_API_KEY="$API_KEY"
    echo "✅ API Key set"
else
    echo "⏭️  Skipped API Key setup"
fi

echo "Please enter your hospital phone number (or press Enter to use default: 6260800477):"
read -r PHONE_NUMBER

if [ -n "$PHONE_NUMBER" ]; then
    supabase secrets set DOUBLETICK_PHONE="$PHONE_NUMBER"
    echo "✅ Phone number set"
else
    supabase secrets set DOUBLETICK_PHONE="6260800477"
    echo "✅ Phone number set to default: 6260800477"
fi
echo ""

# Step 3: Deploy Edge Function
echo "🌐 Step 3: Deploying Edge Function..."
supabase functions deploy send-admission-reminders
if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy Edge Function"
    exit 1
fi
echo "✅ Edge Function deployed"
echo ""

# Step 4: Verify deployment
echo "🔍 Step 4: Verifying deployment..."
echo ""
echo "Checking cron job setup..."
supabase db execute "SELECT * FROM cron.job WHERE jobname = 'send-admission-reminders-daily';"
echo ""

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Ensure your Double Tick template 'patient_admission_reminder' is approved"
echo "2. Recharge your Double Tick wallet"
echo "3. Test the system manually using:"
echo "   supabase functions invoke send-admission-reminders"
echo ""
echo "📖 For detailed instructions, see: WHATSAPP_REMINDER_SETUP.md"
