const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project-url.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const demoUsers = [
  { email: 'admin@example.com', password: 'admin123' },
  { email: 'student@example.com', password: 'student123' },
  { email: 'lecturer@example.com', password: 'lecturer123' },
  { email: 'labstaff@example.com', password: 'labstaff123' }
];

async function setupTraditionalAuth() {
  console.log('Setting up traditional authentication for demo users...');

  for (const user of demoUsers) {
    try {
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);

      console.log(`Updating ${user.email} with hashed password...`);

      // Update the user with the hashed password
      const { data, error } = await supabase
        .from('users')
        .update({ custom_password: hashedPassword })
        .eq('email', user.email)
        .select();

      if (error) {
        console.error(`Error updating ${user.email}:`, error);
      } else {
        console.log(`Successfully updated ${user.email}`);
      }
    } catch (err) {
      console.error(`Error processing ${user.email}:`, err);
    }
  }

  console.log('Traditional authentication setup complete!');
}

// Run the setup
setupTraditionalAuth().catch(console.error);