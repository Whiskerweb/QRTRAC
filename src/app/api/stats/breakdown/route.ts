import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dimension = searchParams.get('dimension') || 'countries'

    // No real breakdown data available yet — return empty
    return NextResponse.json({
        data: [],
        dimension,
    }, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    })
}
