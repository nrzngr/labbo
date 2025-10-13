-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('due_date_reminder', 'approval_required', 'system_maintenance', 'equipment_alert', 'safety_compliance')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only read their own notifications
CREATE POLICY "Users can read own notifications" ON notifications
    FOR SELECT USING (
        user_id = auth.uid() OR
        (user_id IS NULL AND type IN ('system_maintenance', 'equipment_alert', 'safety_compliance'))
    );

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- System can insert notifications for any user
CREATE POLICY "Service role can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_priority TEXT DEFAULT 'medium',
    p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, priority, data)
    VALUES (p_user_id, p_type, p_title, p_message, p_priority, p_data)
    RETURNING id INTO notification_id;

    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
    p_notification_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications
    SET is_read = true, read_at = NOW()
    WHERE id = p_notification_id AND user_id = p_user_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create due date reminder notifications
CREATE OR REPLACE FUNCTION create_due_date_reminders()
RETURNS void AS $$
DECLARE
    reminder_record RECORD;
    notification_id UUID;
BEGIN
    -- Create reminders for transactions due in 3 days
    FOR reminder_record IN
        SELECT
            bt.id,
            bt.user_id,
            e.name as equipment_name,
            e.serial_number,
            bt.expected_return_date
        FROM borrowing_transactions bt
        JOIN equipment e ON bt.equipment_id = e.id
        WHERE bt.status = 'active'
        AND bt.expected_return_date = CURRENT_DATE + INTERVAL '3 days'
    LOOP
        notification_id := create_notification(
            reminder_record.user_id,
            'due_date_reminder',
            'Pengingat Pengembalian Peralatan',
            format('Peralatan "%s" (%s) harus dikembalikan dalam 3 hari pada %s',
                   reminder_record.equipment_name,
                   reminder_record.serial_number,
                   to_char(reminder_record.expected_return_date, 'DD/MM/YYYY')),
            'medium',
            jsonb_build_object(
                'transaction_id', reminder_record.id,
                'equipment_name', reminder_record.equipment_name,
                'due_date', reminder_record.expected_return_date
            )
        );
    END LOOP;

    -- Create reminders for transactions due tomorrow
    FOR reminder_record IN
        SELECT
            bt.id,
            bt.user_id,
            e.name as equipment_name,
            e.serial_number,
            bt.expected_return_date
        FROM borrowing_transactions bt
        JOIN equipment e ON bt.equipment_id = e.id
        WHERE bt.status = 'active'
        AND bt.expected_return_date = CURRENT_DATE + INTERVAL '1 day'
    LOOP
        notification_id := create_notification(
            reminder_record.user_id,
            'due_date_reminder',
            'Pengingat Pengembalian - Besok!',
            format('Peralatan "%s" (%s) harus dikembalikan besok pada %s',
                   reminder_record.equipment_name,
                   reminder_record.serial_number,
                   to_char(reminder_record.expected_return_date, 'DD/MM/YYYY')),
            'high',
            jsonb_build_object(
                'transaction_id', reminder_record.id,
                'equipment_name', reminder_record.equipment_name,
                'due_date', reminder_record.expected_return_date
            )
        );
    END LOOP;

    -- Create overdue notifications
    FOR reminder_record IN
        SELECT
            bt.id,
            bt.user_id,
            e.name as equipment_name,
            e.serial_number,
            bt.expected_return_date
        FROM borrowing_transactions bt
        JOIN equipment e ON bt.equipment_id = e.id
        WHERE bt.status = 'active'
        AND bt.expected_return_date < CURRENT_DATE
    LOOP
        notification_id := create_notification(
            reminder_record.user_id,
            'due_date_reminder',
            'Pengembalian Terlambat!',
            format('Peralatan "%s" (%s) terlambat %s hari. Segera kembalikan!',
                   reminder_record.equipment_name,
                   reminder_record.serial_number,
                   (CURRENT_DATE - reminder_record.expected_return_date)),
            'urgent',
            jsonb_build_object(
                'transaction_id', reminder_record.id,
                'equipment_name', reminder_record.equipment_name,
                'due_date', reminder_record.expected_return_date,
                'days_overdue', CURRENT_DATE - reminder_record.expected_return_date
            )
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create due date reminders
-- This would be called by a scheduled job or cron
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('create-due-date-reminders', '0 9 * * *', 'SELECT create_due_date_reminders();');

COMMENT ON TABLE notifications IS 'System notifications for users about due dates, approvals, and system events';
COMMENT ON FUNCTION create_notification IS 'Create a new notification for a user';
COMMENT ON FUNCTION mark_notification_read IS 'Mark a notification as read for a user';
COMMENT ON FUNCTION create_due_date_reminders IS 'Create due date reminder notifications for active transactions';