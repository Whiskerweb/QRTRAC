import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const results: Record<string, unknown> = {}

    try {
        const supabase = await createClient()

        // 1. Check auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        results.auth = {
            hasUser: !!user,
            userId: user?.id?.slice(0, 8) + '...',
            email: user?.email,
            authError: authError?.message || null,
        }

        // 2. Test profiles table SELECT
        const { data: profileData, error: profileError, status: profileStatus } = await supabase
            .from('profiles')
            .select('id, display_name')
            .limit(1)
        results.profiles = {
            status: profileStatus,
            count: profileData?.length ?? 0,
            error: profileError?.message || null,
            code: profileError?.code || null,
            hint: profileError?.hint || null,
        }

        // 3. Test qr_codes table SELECT
        const { data: qrData, error: qrError, status: qrStatus } = await supabase
            .from('qr_codes')
            .select('id, name')
            .limit(1)
        results.qr_codes = {
            status: qrStatus,
            count: qrData?.length ?? 0,
            error: qrError?.message || null,
            code: qrError?.code || null,
            hint: qrError?.hint || null,
        }

        // 4. Test profile upsert (if user exists)
        if (user) {
            const { data: upsertData, error: upsertError, status: upsertStatus } = await supabase
                .from('profiles')
                .upsert({ id: user.id, display_name: user.email?.split('@')[0] || 'test' }, { onConflict: 'id' })
                .select('id')
                .single()
            results.profileUpsert = {
                status: upsertStatus,
                success: !!upsertData,
                error: upsertError?.message || null,
                code: upsertError?.code || null,
            }
        }

    } catch (err) {
        results.exception = String(err)
    }

    return NextResponse.json(results, {
        headers: { 'Cache-Control': 'no-store' }
    })
}
