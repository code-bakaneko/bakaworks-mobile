import { createClient } from '@supabase/supabase-js'
import { Database } from '../database.types'
import 'server-only'

export const supabaseAdmin = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET!, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})