CREATE TYPE category AS ENUM ('electronics', 'mechanical', 'chemical', 'optical', 'measurement', 'computer', 'general');

CREATE TYPE user_role AS ENUM ('admin', 'lab_staff', 'lecturer', 'student');

CREATE TYPE equipment_status AS ENUM ('available', 'borrowed', 'maintenance', 'retired');

CREATE TYPE transaction_status AS ENUM ('active', 'returned', 'overdue');

CREATE TYPE maintenance_type AS ENUM ('routine', 'repair', 'calibration', 'replacement');

-- New types for scheduling system
CREATE TYPE reservation_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled', 'completed');
CREATE TYPE recurrence_pattern AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
CREATE TYPE frequency_unit AS ENUM ('days', 'weeks', 'months', 'years');
CREATE TYPE maintenance_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE maintenance_schedule_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE waitlist_priority AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category category NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    department TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    phone TEXT,
    nim TEXT UNIQUE, -- Student ID number (required for students)
    nip TEXT UNIQUE, -- Staff ID number (required for staff/lecturers)
    student_level TEXT, -- For students: freshman, sophomore, junior, senior
    lecturer_rank TEXT, -- For lecturers: assistant, associate, professor
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_nim_nip CHECK (
        (role = 'student' AND nim IS NOT NULL AND nip IS NULL) OR
        (role IN ('lecturer', 'lab_staff', 'admin') AND nip IS NOT NULL AND nim IS NULL) OR
        (role NOT IN ('student', 'lecturer', 'lab_staff', 'admin'))
    )
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    serial_number TEXT UNIQUE NOT NULL,
    category_id UUID REFERENCES categories(id),
    location TEXT,
    purchase_date DATE,
    purchase_price DECIMAL(10, 2),
    warranty_expiry DATE,
    status equipment_status DEFAULT 'available',
    condition TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE borrowing_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    equipment_id UUID REFERENCES equipment(id) NOT NULL,
    borrow_date DATE NOT NULL,
    expected_return_date DATE NOT NULL,
    actual_return_date DATE,
    status transaction_status DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE maintenance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES equipment(id) NOT NULL,
    maintenance_type maintenance_type NOT NULL,
    description TEXT NOT NULL,
    maintenance_date DATE NOT NULL,
    cost DECIMAL(10, 2),
    performed_by TEXT,
    next_maintenance_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Reservations Table
CREATE TABLE equipment_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES equipment(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status reservation_status DEFAULT 'pending',
    approval_required BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservation Recurrence Patterns Table
CREATE TABLE reservation_recurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID REFERENCES equipment_reservations(id) ON DELETE CASCADE,
    pattern_type recurrence_pattern NOT NULL,
    interval_value INTEGER NOT NULL,
    days_of_week TEXT[],
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance Schedules Table
CREATE TABLE maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES equipment(id) NOT NULL,
    maintenance_type maintenance_type NOT NULL,
    scheduled_date DATE NOT NULL,
    frequency_interval INTEGER,
    frequency_unit frequency_unit,
    assigned_to UUID REFERENCES users(id),
    estimated_duration_hours INTEGER,
    priority maintenance_priority DEFAULT 'medium',
    status maintenance_schedule_status DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calibration Records Table
CREATE TABLE calibration_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES equipment(id) NOT NULL,
    calibration_date DATE NOT NULL,
    next_calibration_date DATE NOT NULL,
    performed_by TEXT NOT NULL,
    certificate_number TEXT,
    certificate_url TEXT,
    calibration_results JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance Parts Inventory Table
CREATE TABLE maintenance_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_name TEXT NOT NULL,
    part_number TEXT UNIQUE,
    supplier_id UUID,
    current_stock INTEGER DEFAULT 0,
    minimum_stock INTEGER DEFAULT 0,
    unit_cost DECIMAL(10,2),
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QR Code Management Table
CREATE TABLE equipment_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES equipment(id) NOT NULL,
    qr_code_data TEXT UNIQUE NOT NULL,
    qr_code_url TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    printed_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

-- Waitlist Management Table
CREATE TABLE reservation_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES equipment(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    requested_start_time TIMESTAMPTZ NOT NULL,
    requested_end_time TIMESTAMPTZ NOT NULL,
    priority waitlist_priority DEFAULT 'normal',
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE VIEW equipment_status_view AS
SELECT
    e.*,
    c.name as category_name,
    c.description as category_description,
    CASE
        WHEN bt.status = 'active' THEN 'borrowed'
        WHEN e.status = 'maintenance' THEN 'maintenance'
        ELSE 'available'
    END as current_status,
    CASE
        WHEN bt.status = 'active' THEN bt.expected_return_date
        ELSE NULL
    END as return_due_date
FROM equipment e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN borrowing_transactions bt ON e.id = bt.equipment_id AND bt.status = 'active';

CREATE VIEW user_borrowing_history AS
SELECT
    bt.*,
    u.full_name,
    u.email,
    u.department,
    u.role as user_role,
    e.name as equipment_name,
    e.serial_number,
    c.name as category_name
FROM borrowing_transactions bt
JOIN users u ON bt.user_id = u.id
JOIN equipment e ON bt.equipment_id = e.id
JOIN categories c ON e.category_id = c.id
ORDER BY bt.borrow_date DESC;

-- Enhanced equipment status view with reservations
CREATE VIEW equipment_comprehensive_status AS
SELECT
    e.*,
    c.name as category_name,
    c.description as category_description,
    qrc.qr_code_data,
    qrc.qr_code_url,
    CASE
        WHEN er.status IN ('approved', 'completed') AND
             er.start_time <= NOW() AND er.end_time > NOW() THEN 'reserved'
        WHEN bt.status = 'active' THEN 'borrowed'
        WHEN e.status = 'maintenance' OR
             EXISTS(SELECT 1 FROM maintenance_schedules ms
                   WHERE ms.equipment_id = e.id AND ms.status = 'scheduled') THEN 'maintenance'
        ELSE 'available'
    END as current_status,
    CASE
        WHEN er.status IN ('approved', 'completed') AND
             er.start_time <= NOW() AND er.end_time > NOW() THEN er.end_time
        WHEN bt.status = 'active' THEN bt.expected_return_date
        ELSE NULL
    END as return_due_date,
    CASE
        WHEN cr.next_calibration_date < CURRENT_DATE THEN 'calibration_overdue'
        WHEN cr.next_calibration_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'calibration_due'
        ELSE NULL
    END as calibration_status
FROM equipment e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN equipment_qr_codes qrc ON e.id = qrc.equipment_id AND qrc.is_active = true
LEFT JOIN borrowing_transactions bt ON e.id = bt.equipment_id AND bt.status = 'active'
LEFT JOIN equipment_reservations er ON e.id = er.equipment_id
    AND er.status IN ('approved', 'completed')
    AND er.start_time <= NOW() AND er.end_time > NOW()
LEFT JOIN LATERAL (
    SELECT next_calibration_date
    FROM calibration_records cr2
    WHERE cr2.equipment_id = e.id
    ORDER BY calibration_date DESC
    LIMIT 1
) cr ON true;

-- Reservations calendar view
CREATE VIEW reservation_calendar AS
SELECT
    er.*,
    e.name as equipment_name,
    e.serial_number,
    u.full_name as user_name,
    u.email as user_email,
    u.department as user_department,
    u.role as user_role,
    c.name as category_name,
    EXTRACT(EPOCH FROM (er.end_time - er.start_time))/3600 as duration_hours
FROM equipment_reservations er
JOIN equipment e ON er.equipment_id = e.id
JOIN users u ON er.user_id = u.id
LEFT JOIN categories c ON e.category_id = c.id
WHERE er.status IN ('approved', 'completed')
ORDER BY er.start_time;

-- Maintenance schedule view
CREATE VIEW maintenance_schedule_view AS
SELECT
    ms.*,
    e.name as equipment_name,
    e.serial_number,
    u.full_name as assigned_to_name,
    u.email as assigned_to_email,
    c.name as category_name,
    CASE
        WHEN ms.scheduled_date < CURRENT_DATE THEN 'overdue'
        WHEN ms.scheduled_date = CURRENT_DATE THEN 'due_today'
        WHEN ms.scheduled_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
        ELSE 'scheduled'
    END as urgency_status
FROM maintenance_schedules ms
JOIN equipment e ON ms.equipment_id = e.id
LEFT JOIN users u ON ms.assigned_to = u.id
LEFT JOIN categories c ON e.category_id = c.id
WHERE ms.status != 'completed'
ORDER BY ms.scheduled_date, ms.priority;

CREATE OR REPLACE FUNCTION update_equipment_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE equipment SET status = 'borrowed' WHERE id = NEW.equipment_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'active' AND NEW.status = 'returned' THEN
            UPDATE equipment SET status = 'available' WHERE id = NEW.equipment_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_equipment_status_update
    AFTER INSERT OR UPDATE ON borrowing_transactions
    FOR EACH ROW EXECUTE FUNCTION update_equipment_status();

CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_categories
    AFTER INSERT OR UPDATE OR DELETE ON categories
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_equipment
    AFTER INSERT OR UPDATE OR DELETE ON equipment
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_borrowing_transactions
    AFTER INSERT OR UPDATE OR DELETE ON borrowing_transactions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_maintenance_records
    AFTER INSERT OR UPDATE OR DELETE ON maintenance_records
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Audit triggers for new tables
CREATE TRIGGER audit_equipment_reservations
    AFTER INSERT OR UPDATE OR DELETE ON equipment_reservations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_reservation_recurrences
    AFTER INSERT OR UPDATE OR DELETE ON reservation_recurrences
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_maintenance_schedules
    AFTER INSERT OR UPDATE OR DELETE ON maintenance_schedules
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_calibration_records
    AFTER INSERT OR UPDATE OR DELETE ON calibration_records
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_maintenance_parts
    AFTER INSERT OR UPDATE OR DELETE ON maintenance_parts
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_equipment_qr_codes
    AFTER INSERT OR UPDATE OR DELETE ON equipment_qr_codes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_reservation_waitlist
    AFTER INSERT OR UPDATE OR DELETE ON reservation_waitlist
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE OR REPLACE FUNCTION check_equipment_availability()
RETURNS TRIGGER AS $$
DECLARE
    equipment_status_value TEXT;
BEGIN
    SELECT status INTO equipment_status_value FROM equipment WHERE id = NEW.equipment_id;

    IF equipment_status_value != 'available' THEN
        RAISE EXCEPTION 'Equipment is not available for borrowing';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check for reservation conflicts
CREATE OR REPLACE FUNCTION check_reservation_conflict(
    p_equipment_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_exclude_reservation_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO conflict_count
    FROM equipment_reservations
    WHERE equipment_id = p_equipment_id
      AND status IN ('approved', 'completed')
      AND (
          (start_time <= p_start_time AND end_time > p_start_time) OR
          (start_time < p_end_time AND end_time >= p_end_time) OR
          (start_time >= p_start_time AND end_time <= p_end_time)
      )
      AND (p_exclude_reservation_id IS NULL OR id != p_exclude_reservation_id);

    RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to check equipment availability for time slot
CREATE OR REPLACE FUNCTION is_equipment_available(
    p_equipment_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
DECLARE
    is_available BOOLEAN;
    equipment_maintenance BOOLEAN;
BEGIN
    -- Check if equipment is in maintenance status
    SELECT (status = 'available') INTO is_available
    FROM equipment
    WHERE id = p_equipment_id;

    -- Check for scheduled maintenance during the time slot
    SELECT NOT EXISTS(
        SELECT 1 FROM maintenance_schedules
        WHERE equipment_id = p_equipment_id
          AND scheduled_date <= DATE(p_end_time)
          AND (scheduled_date + INTERVAL '1 day' * INTERVAL '1' >= DATE(p_start_time))
          AND status IN ('scheduled', 'in_progress')
    ) INTO equipment_maintenance;

    -- Check for reservation conflicts
    PERFORM check_reservation_conflict(p_equipment_id, p_start_time, p_end_time);

    RETURN is_available AND equipment_maintenance;
END;
$$ LANGUAGE plpgsql;

-- Function to generate time slots for a day
CREATE OR REPLACE FUNCTION generate_time_slots(
    p_equipment_id UUID,
    p_date DATE,
    p_slot_duration_minutes INTEGER DEFAULT 60
)
RETURNS TABLE(
    slot_start TIMESTAMPTZ,
    slot_end TIMESTAMPTZ,
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (p_date + INTERVAL '1 hour' * (n - 8)) AS slot_start,
        (p_date + INTERVAL '1 hour' * (n - 8 + p_slot_duration_minutes/60)) AS slot_end,
        is_equipment_available(p_equipment_id,
            (p_date + INTERVAL '1 hour' * (n - 8)),
            (p_date + INTERVAL '1 hour' * (n - 8 + p_slot_duration_minutes/60))
    ) AS is_available
    FROM generate_series(8, 17, p_slot_duration_minutes/60) AS n;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-approve reservations based on user role and equipment value
CREATE OR REPLACE FUNCTION auto_approve_reservation()
RETURNS TRIGGER AS $$
DECLARE
    user_role_val TEXT;
    equipment_price DECIMAL;
    should_approve BOOLEAN;
BEGIN
    -- Get user role and equipment price
    SELECT role INTO user_role_val FROM users WHERE id = NEW.user_id;
    SELECT purchase_price INTO equipment_price FROM equipment WHERE id = NEW.equipment_id;

    -- Auto-approve logic
    should_approve := CASE
        WHEN user_role_val IN ('admin', 'lab_staff', 'lecturer') THEN true
        WHEN user_role_val = 'student' AND (equipment_price IS NULL OR equipment_price < 1000) THEN true
        ELSE false
    END;

    IF should_approve THEN
        NEW.status := 'approved';
        NEW.approved_by := NEW.user_id; -- Self-approved
        NEW.approved_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_equipment_availability
    BEFORE INSERT ON borrowing_transactions
    FOR EACH ROW EXECUTE FUNCTION check_equipment_availability();

-- Triggers for reservation system
CREATE TRIGGER trigger_auto_approve_reservation
    BEFORE INSERT ON equipment_reservations
    FOR EACH ROW EXECUTE FUNCTION auto_approve_reservation();

CREATE OR REPLACE FUNCTION check_reservation_conflict_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT check_reservation_conflict(NEW.equipment_id, NEW.start_time, NEW.end_time) THEN
        RAISE EXCEPTION 'Equipment is already reserved for the selected time slot';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_reservation_conflict
    BEFORE INSERT OR UPDATE ON equipment_reservations
    FOR EACH ROW EXECUTE FUNCTION check_reservation_conflict_trigger();

CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_category ON equipment(category_id);
CREATE INDEX idx_borrowing_transactions_user ON borrowing_transactions(user_id);
CREATE INDEX idx_borrowing_transactions_equipment ON borrowing_transactions(equipment_id);
CREATE INDEX idx_borrowing_transactions_status ON borrowing_transactions(status);
CREATE INDEX idx_borrowing_transactions_dates ON borrowing_transactions(borrow_date, expected_return_date);
CREATE INDEX idx_maintenance_records_equipment ON maintenance_records(equipment_id);
CREATE INDEX idx_maintenance_records_date ON maintenance_records(maintenance_date);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- Indexes for new scheduling system tables
CREATE INDEX idx_equipment_reservations_equipment ON equipment_reservations(equipment_id);
CREATE INDEX idx_equipment_reservations_user ON equipment_reservations(user_id);
CREATE INDEX idx_equipment_reservations_status ON equipment_reservations(status);
CREATE INDEX idx_equipment_reservations_times ON equipment_reservations(start_time, end_time);
CREATE INDEX idx_reservation_recurrences_reservation ON reservation_recurrences(reservation_id);
CREATE INDEX idx_maintenance_schedules_equipment ON maintenance_schedules(equipment_id);
CREATE INDEX idx_maintenance_schedules_date ON maintenance_schedules(scheduled_date);
CREATE INDEX idx_maintenance_schedules_status ON maintenance_schedules(status);
CREATE INDEX idx_calibration_records_equipment ON calibration_records(equipment_id);
CREATE INDEX idx_calibration_records_date ON calibration_records(calibration_date);
CREATE INDEX idx_calibration_records_next_date ON calibration_records(next_calibration_date);
CREATE INDEX idx_maintenance_parts_part_number ON maintenance_parts(part_number);
CREATE INDEX idx_equipment_qr_codes_equipment ON equipment_qr_codes(equipment_id);
CREATE INDEX idx_equipment_qr_codes_data ON equipment_qr_codes(qr_code_data);
CREATE INDEX idx_reservation_waitlist_equipment ON reservation_waitlist(equipment_id);
CREATE INDEX idx_reservation_waitlist_user ON reservation_waitlist(user_id);
CREATE INDEX idx_reservation_waitlist_priority ON reservation_waitlist(priority);
CREATE INDEX idx_reservation_waitlist_created ON reservation_waitlist(created_at);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Enable RLS for new tables
ALTER TABLE equipment_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_recurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_waitlist ENABLE ROW LEVEL SECURITY;