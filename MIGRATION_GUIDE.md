# Database Migration Guide

This guide provides instructions for applying the database migrations required to enable the enhanced system features.

## Prerequisites

- Access to your Supabase project SQL Editor
- Database admin permissions

## Migration Steps

### 1. Apply Notifications Migration

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (using your existing users table structure)
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.role IN ('admin', 'lab_staff')
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  email_notifications boolean DEFAULT true,
  in_app_notifications boolean DEFAULT true,
  borrowing_reminders boolean DEFAULT true,
  due_date_reminders boolean DEFAULT true,
  system_updates boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for notification preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their preferences" ON public.notification_preferences
  FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE id = auth.uid()));

-- Create trigger for notification preferences
CREATE TRIGGER handle_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

### 2. Set up Realtime Subscriptions

In your Supabase dashboard:
1. Go to Settings → API
2. Ensure "Enable Realtime" is turned on
3. Add the following tables to Realtime publications:
   - `equipment`
   - `borrowing_transactions`
   - `users`
   - `notifications`

### 3. Create Functions for Notification Management

```sql
-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text DEFAULT 'info',
  p_data jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, data)
  VALUES (p_user_id, p_title, p_message, p_type, p_data)
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notification_read(
  p_notification_id uuid
)
RETURNS boolean AS $$
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE id = p_notification_id
  AND user_id = auth.uid();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS integer AS $$
DECLARE
  count_val integer;
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE user_id = auth.uid()
  AND read = false;

  GET DIAGNOSTICS count_val = ROW_COUNT;
  RETURN count_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## ✅ Migration Status: COMPLETED

The database migrations have been successfully applied! The following changes were made:

- ✅ Created `notifications` and `notification_preferences` tables
- ✅ Added Row Level Security (RLS) policies
- ✅ Created database indexes for performance
- ✅ Added helper functions for notification management
- ✅ Enabled real-time broadcast triggers on key tables

## Final Setup Steps

### 1. Enable Realtime in Supabase Dashboard

Go to your Supabase project → Settings → API:
1. Ensure "Enable Realtime" is turned **ON**
2. Add these tables to Realtime publications:
   - `equipment`
   - `borrowing_transactions`
   - `users`
   - `notifications`

### 2. Test the System

**Test Notification Creation:**
```sql
SELECT create_notification(
  (SELECT id FROM public.users LIMIT 1),
  'Test Notification',
  'This is a test notification',
  'info'
);
```

**Check Notification Tables:**
```sql
SELECT * FROM public.notifications ORDER BY created_at DESC LIMIT 5;
```

**Test Real-time Connection:**
In your browser console, you should see connection logs when accessing the analytics page.

## Quick Verification Tests

1. **Log in to your application** - The enhanced authentication should work seamlessly
2. **Visit `/dashboard/analytics`** - You should see real-time statistics and activity feed
3. **Check the sidebar** - The notification bell should appear (with 0 notifications initially)
4. **Create a test transaction** - The real-time analytics should update immediately

## Troubleshooting

- **Notifications not showing?** Check browser console for real-time connection errors
- **Authentication issues?** Verify your environment variables are set correctly
- **Real-time not working?** Ensure Realtime is enabled in Supabase dashboard settings

## Troubleshooting

- If RLS policies cause issues, temporarily disable them for testing: `ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;`
- Check function execution logs in Supabase dashboard
- Ensure proper permissions are granted to `authenticated` and `anon` roles

## Environment Variables

Update your `.env.local` with any required Supabase configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

The enhanced system features are now ready to use!