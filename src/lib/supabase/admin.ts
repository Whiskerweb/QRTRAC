import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Admin Supabase client using the service role key.
 * Bypasses RLS — use only in server actions / API routes.
 */
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!serviceKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    }

    return createSupabaseClient(url, serviceKey, {
        auth: { persistSession: false },
    })
}
