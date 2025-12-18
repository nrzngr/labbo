import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Note: This client uses the Service Role Key, which bypasses Row Level Security (RLS).
// It should ONLY be used in secure Server Actions or API routes where the user's
// permissions have already been strictly verified.
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined')
    }

    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}
