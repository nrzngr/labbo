-- SQL Script to Create Demo Users for Testing
-- Run this in your Supabase SQL Editor

-- Demo Users for Testing
-- Note: These users will need to be created in Supabase Auth first
-- Use the Supabase Dashboard → Authentication → Users to create them

-- Create user profiles for demo accounts (run after creating auth users)
INSERT INTO public.users (id, email, password_hash, full_name, role, department, nim, nip, is_active) VALUES
-- Admin user (create this user in Supabase Auth first, then replace ID below)
('YOUR_ADMIN_UUID_HERE', 'admin@example.com', 'supabase_auth_managed', 'Administrator', 'admin', 'System Administration', null, 'ADMIN001', true),

-- Student user
('YOUR_STUDENT_UUID_HERE', 'student@example.com', 'supabase_auth_managed', 'Student User', 'student', 'Computer Science', 'STU001', null, true),

-- Lecturer user
('YOUR_LECTURER_UUID_HERE', 'lecturer@example.com', 'supabase_auth_managed', 'Lecturer User', 'lecturer', 'Computer Science', null, 'LEC001', true),

-- Lab Staff user
('YOUR_LABSTAFF_UUID_HERE', 'labstaff@example.com', 'supabase_auth_managed', 'Lab Staff User', 'lab_staff', 'Laboratory', null, 'LAB001', true)

ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  nim = EXCLUDED.nim,
  nip = EXCLUDED.nip,
  is_active = EXCLUDED.is_active;

-- Create some sample equipment for testing
INSERT INTO public.categories (name, description, category) VALUES
('Laptop', 'Laptop computers for student use', 'computer'),
('Microscope', 'Laboratory microscopes', 'optical'),
('Oscilloscope', 'Digital oscilloscopes', 'electronics'),
('Balance Scale', 'Precision balance scales', 'measurement')
ON CONFLICT DO NOTHING;

-- Get category IDs
WITH category_ids AS (
  SELECT id, name FROM public.categories
),
-- Insert sample equipment
equipment_insert AS (
  INSERT INTO public.equipment (name, description, serial_number, category_id, status, location)
  SELECT
    'Dell Latitude ' || generate_series,
    'High-performance laptop for programming and design work',
    'DL' || LPAD(generate_series::text, 5, '0') || '-2024',
    c.id,
    'available',
    'Lab Room ' || (generate_series % 3 + 1)
  FROM category_ids c, generate_series(1, 3)
  WHERE c.name = 'Laptop'
  ON CONFLICT (serial_number) DO NOTHING
  RETURNING *
)
SELECT 'Equipment inserted successfully' as result;

-- Alternative: Simple demo user creation (if you want to skip auth and test locally)
-- You can temporarily modify the enhanced-auth-provider to bypass Supabase auth
-- and use these demo users directly from the database

SELECT 'Demo setup script executed. Please create the auth users in Supabase Dashboard first.' as message;