import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getCurrentUserWorkspace() {
    // Auth check via session client (reads cookies)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return null

    // DB query via admin client (bypasses RLS)
    const admin = createAdminClient()
    const { data: membership, error: memberError } = await admin
        .from('WorkspaceMember')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

    if (memberError) {
        console.warn('[workspace] WorkspaceMember query failed:', memberError.message)
    }

    if (membership) {
        return { workspaceId: membership.workspace_id, userId: user.id }
    }

    // Fallback for standalone QR users: use user ID as workspace scope
    return { workspaceId: user.id, userId: user.id }
}
