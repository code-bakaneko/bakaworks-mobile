import { createClient } from '@supabase/supabase-js'
import { Database } from '../database.types'
import 'server-only'

// Name must match .env.local, which defines SECRET_KEY.
export const supabaseAdmin = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SECRET_KEY!, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})