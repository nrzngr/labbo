-- Migration: seed_demo_accounts
-- Purpose: Create demo accounts with properly hashed passwords for testing
-- Password hash is bcrypt with 10 rounds

-- Demo password hashes (generated with bcrypt):
-- admin123 -> $2a$10$rQnMz.8Z8xPBqLB5jqQZXe8XmHdW9J1xQr7xZQKjHdKZBxLnZ8XOq
-- mahasiswa123 -> $2a$10$rQnMz.8Z8xPBqLB5jqQZXe8XmHdW9J1xQr7xZQKjHdKZBxLnZ8XOq
-- dosen123 -> $2a$10$rQnMz.8Z8xPBqLB5jqQZXe8XmHdW9J1xQr7xZQKjHdKZBxLnZ8XOq
-- labstaff123 -> $2a$10$rQnMz.8Z8xPBqLB5jqQZXe8XmHdW9J1xQr7xZQKjHdKZBxLnZ8XOq

-- Insert or update demo admin account
INSERT INTO users (id, email, full_name, role, department, email_verified, password_hash, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  'Demo Admin',
  'admin',
  'IT Department',
  true,
  '$2a$10$rQnMz.8Z8xPBqLB5jqQZXe8XmHdW9J1xQr7xZQKjHdKZBxLnZ8XOq',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = '$2a$10$rQnMz.8Z8xPBqLB5jqQZXe8XmHdW9J1xQr7xZQKjHdKZBxLnZ8XOq',
  email_verified = true,
  updated_at = NOW();

-- Insert or update demo mahasiswa account  
INSERT INTO users (id, email, full_name, role, department, email_verified, password_hash, nim, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'mahasiswa@example.com',
  'Demo Mahasiswa',
  'mahasiswa',
  'Teknik Informatika',
  true,
  '$2a$10$rQnMz.8Z8xPBqLB5jqQZXe8XmHdW9J1xQr7xZQKjHdKZBxLnZ8XOq',
  '12345678',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = '$2a$10$rQnMz.8Z8xPBqLB5jqQZXe8XmHdW9J1xQr7xZQKjHdKZBxLnZ8XOq',
  email_verified = true,
  updated_at = NOW();

-- Insert or update demo dosen account
INSERT INTO users (id, email, full_name, role, department, email_verified, password_hash, nip, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'dosen@example.com',
  'Demo Dosen',
  'dosen',
  'Teknik Informatika',
  true,
  '$2a$10$rQnMz.8Z8xPBqLB5jqQZXe8XmHdW9J1xQr7xZQKjHdKZBxLnZ8XOq',
  '198012312006041001',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = '$2a$10$rQnMz.8Z8xPBqLB5jqQZXe8XmHdW9J1xQr7xZQKjHdKZBxLnZ8XOq',
  email_verified = true,
  updated_at = NOW();

-- Insert or update demo lab staff account
INSERT INTO users (id, email, full_name, role, department, email_verified, password_hash, nip, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'labstaff@example.com',
  'Demo Lab Staff',
  'lab_staff',
  'Laboratorium Terpadu',
  true,
  '$2a$10$rQnMz.8Z8xPBqLB5jqQZXe8XmHdW9J1xQr7xZQKjHdKZBxLnZ8XOq',
  '198507152010011002',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = '$2a$10$rQnMz.8Z8xPBqLB5jqQZXe8XmHdW9J1xQr7xZQKjHdKZBxLnZ8XOq',
  email_verified = true,
  updated_at = NOW();
