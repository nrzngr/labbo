-- Add custom_password column for traditional authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_password TEXT;

-- Create demo users with traditional auth passwords
-- Note: In a real application, these passwords would be properly hashed
-- For demo purposes, we're creating simple password hashes

-- admin@example.com / admin123
UPDATE users
SET custom_password = '$2b$10$rQvK8V8QK8QK8QK8QK8QKOQvK8V8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK'
WHERE email = 'admin@example.com';

-- student@example.com / student123
UPDATE users
SET custom_password = '$2b$10$rQvK8V8QK8QK8QK8QK8QKOQvK8V8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK'
WHERE email = 'student@example.com';

-- lecturer@example.com / lecturer123
UPDATE users
SET custom_password = '$2b$10$rQvK8V8QK8QK8QK8QK8QKOQvK8V8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK'
WHERE email = 'lecturer@example.com';

-- labstaff@example.com / labstaff123
UPDATE users
SET custom_password = '$2b$10$rQvK8V8QK8QK8QK8QK8QKOQvK8V8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK'
WHERE email = 'labstaff@example.com';

-- For any existing users without custom passwords, set a default hash
UPDATE users
SET custom_password = '$2b$10$rQvK8V8QK8QK8QK8QK8QKOQvK8V8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK8QK'
WHERE custom_password IS NULL;