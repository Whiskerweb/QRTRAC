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

    // Auto-create workspace for standalone QR users
    const slug = `qr-${user.id.slice(0, 8)}`
    const displayName = user.email?.split('@')[0] || 'QR User'
    const workspaceId = crypto.randomUUID()

    const { error: wsError } = await admin.from('Workspace').insert({
        id: workspaceId,
        name: `${displayName}'s workspace`,
        slug,
        owner_id: user.id,
    })

    if (wsError) {
        // Workspace with this slug may already exist (race condition) — try to find it
        if (wsError.message.includes('unique') || wsError.message.includes('duplicate')) {
            const { data: existing } = await admin
                .from('Workspace')
                .select('id')
                .eq('owner_id', user.id)
                .limit(1)
                .maybeSingle()
            if (existing) {
                // Also ensure WorkspaceMember exists
                await admin.from('WorkspaceMember').upsert({
                    id: crypto.randomUUID(),
                    workspace_id: existing.id,
                    user_id: user.id,
                    role: 'OWNER',
                }, { onConflict: 'workspace_id,user_id' })
                return { workspaceId: existing.id, userId: user.id }
            }
        }
        console.error('[workspace] Failed to create workspace:', wsError.message)
        return null
    }

    // Create WorkspaceMember
    await admin.from('WorkspaceMember').insert({
        id: crypto.randomUUID(),
        workspace_id: workspaceId,
        user_id: user.id,
        role: 'OWNER',
    })

    return { workspaceId, userId: user.id }
}
