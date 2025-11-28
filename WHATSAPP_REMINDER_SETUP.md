# WhatsApp Admission Reminder Setup Guide

This system automatically sends WhatsApp reminders 5 days after patient admission using Double Tick API.

## 📋 Prerequisites

1. ✅ Double Tick account with WhatsApp Business API
2. ✅ Template approved by WhatsApp/Meta
3. ✅ API key from Double Tick
4. ✅ Supabase project with pg_cron enabled

---

## 🚀 Setup Instructions

### Step 1: Apply Database Migrations

Run these migrations in order:

```bash
# Navigate to your project directory
cd D:\open project\Adamrit\adamrit.com

# Apply migrations using Supabase CLI
supabase db push
```

Or manually run these SQL files in Supabase SQL Editor:
1. `supabase/migrations/20251004000001_create_whatsapp_notifications_table.sql`
2. `supabase/migrations/20251004000002_setup_admission_reminder_cron.sql`

---

### Step 2: Configure Environment Variables in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/xvkxccqaopbnkvwgyfjv
2. Navigate to **Settings** → **Edge Functions** → **Secrets**
3. Add the following environment variables:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `DOUBLETICK_API_KEY` | `key_8sc9MP6JpQ` | Your Double Tick API key |
| `DOUBLETICK_PHONE` | `6260800477` | Hospital staff phone number to receive notifications |

**How to add:**
```bash
# Using Supabase CLI
supabase secrets set DOUBLETICK_API_KEY=key_8sc9MP6JpQ
supabase secrets set DOUBLETICK_PHONE=6260800477
```

Or in Supabase Dashboard:
- Click **"New Secret"**
- Enter name and value
- Click **"Save"**

---

### Step 3: Deploy Edge Function

```bash
# Deploy the function
supabase functions deploy send-admission-reminders

# Verify deployment
supabase functions list
```

---

### Step 4: Enable pg_cron Extension (if not enabled)

1. Go to Supabase Dashboard → **Database** → **Extensions**
2. Search for `pg_cron`
3. Click **"Enable"**

---

### Step 5: Verify Cron Job Setup

Run this query in Supabase SQL Editor:

```sql
-- Check if cron job is scheduled
SELECT * FROM cron.job WHERE jobname = 'send-admission-reminders-daily';

-- Check cron job status
SELECT * FROM cron_job_status;
```

You should see:
- **Schedule**: `30 4 * * *` (runs daily at 10:00 AM IST / 4:30 AM UTC)
- **Active**: `true`

---

## 🧪 Testing

### Manual Test (Before Template Approval)

Once your Double Tick template is approved, test manually:

```bash
# Test the function manually
supabase functions invoke send-admission-reminders
```

Or using SQL:

```sql
-- Manually trigger the function
SELECT net.http_post(
    url := 'https://xvkxccqaopbnkvwgyfjv.supabase.co/functions/v1/send-admission-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
);
```

### Create Test Data

To test with sample data, create a visit with admission date 5 days ago:

```sql
-- Insert test visit with admission 5 days ago
INSERT INTO visits (
    visit_id,
    patient_id,
    admission_date,
    visit_type,
    status
)
SELECT
    'IH25J0TEST',
    id,
    CURRENT_DATE - INTERVAL '5 days',
    'IPD',
    'admitted'
FROM patients
LIMIT 1;
```

---

## 📊 Monitoring

### Check Notification Logs

```sql
-- View all sent notifications
SELECT
    patient_name,
    admission_date,
    status,
    sent_at,
    error_message
FROM whatsapp_notifications
ORDER BY created_at DESC;

-- Count notifications by status
SELECT
    status,
    COUNT(*) as count
FROM whatsapp_notifications
GROUP BY status;
```

### Check Cron Job History

```sql
-- View recent cron job runs
SELECT
    start_time,
    end_time,
    status,
    return_message
FROM cron.job_run_details
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname = 'send-admission-reminders-daily')
ORDER BY start_time DESC
LIMIT 10;
```

---

## ⚙️ Configuration

### Change Notification Time

To change when notifications are sent (default: 10:00 AM IST):

```sql
-- Reschedule to different time (example: 9:00 AM IST = 3:30 AM UTC)
SELECT cron.schedule(
    'send-admission-reminders-daily',
    '30 3 * * *', -- Change this cron expression
    $$
    SELECT net.http_post(
        url := 'https://xvkxccqaopbnkvwgyfjv.supabase.co/functions/v1/send-admission-reminders',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := '{}'::jsonb
    );
    $$
);
```

### Cron Expression Examples

| Time (IST) | UTC Time | Cron Expression |
|------------|----------|-----------------|
| 8:00 AM | 2:30 AM | `30 2 * * *` |
| 9:00 AM | 3:30 AM | `30 3 * * *` |
| 10:00 AM | 4:30 AM | `30 4 * * *` |
| 12:00 PM | 6:30 AM | `30 6 * * *` |

---

## 🐛 Troubleshooting

### 1. Function Not Running

**Check if cron job is active:**
```sql
SELECT * FROM cron.job WHERE jobname = 'send-admission-reminders-daily';
```

**If not active, reschedule:**
```sql
SELECT cron.schedule('send-admission-reminders-daily', '30 4 * * *', ...);
```

### 2. Messages Not Sending

**Check notification logs:**
```sql
SELECT * FROM whatsapp_notifications WHERE status = 'failed' ORDER BY created_at DESC;
```

**Common issues:**
- ❌ Template not approved in Double Tick
- ❌ API key incorrect
- ❌ Template name mismatch
- ❌ Phone number format incorrect

### 3. Check Edge Function Logs

In Supabase Dashboard:
1. Go to **Edge Functions** → **send-admission-reminders**
2. Click **"Logs"** tab
3. View execution logs and errors

---

## 📱 Double Tick Template Configuration

Your template details:
- **Template Name**: `patient_admission_reminder`
- **Language**: English (en)
- **Category**: Utility
- **Variables**:
  1. Patient Name
  2. Registration Date (DD/MM/YYYY)
  3. Corporate Name

**Message Format:**
```
👩‍⚕️ Patient Update

Patient Name: {{1}}
Registration Date: {{2}}
Corporate: {{3}}

It has now been 5 days since admission.
If an extension is required, kindly cross-check and update at the earliest. ✅
```

---

## 📞 Support

For issues or questions:
1. Check Supabase Edge Function logs
2. Check `whatsapp_notifications` table for errors
3. Verify Double Tick template is approved
4. Ensure environment variables are set correctly

---

## 🔄 System Flow

1. **Cron Job Triggers** (Daily at 10:00 AM IST)
2. **Edge Function Executes** (`send-admission-reminders`)
3. **Query Database** for visits with `admission_date = CURRENT_DATE - 5 days`
4. **For Each Visit:**
   - Check if notification already sent
   - Format message with patient details
   - Send via Double Tick API
   - Log result in `whatsapp_notifications` table
5. **Staff Receives WhatsApp** notification on `6260800477`

---

**✅ Setup Complete!** Once your Double Tick template is approved, the system will automatically send reminders daily.
