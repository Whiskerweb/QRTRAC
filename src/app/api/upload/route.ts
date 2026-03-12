import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const type = formData.get('type') as string | null

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        if (!type || type !== 'og_image') {
            return NextResponse.json({ error: 'Invalid type. Only og_image is supported.' }, { status: 400 })
        }

        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!validImageTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid image format. Use JPG, PNG or WebP.' }, { status: 400 })
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 })
        }

        const timestamp = Date.now()
        const extension = file.name.split('.').pop()
        const filename = `${user.id}_${timestamp}.${extension}`
        const storagePath = `og-images/${filename}`

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const { error } = await supabase.storage
            .from('upload')
            .upload(storagePath, buffer, {
                contentType: file.type,
                upsert: true,
            })

        if (error) {
            console.error('[Upload] Supabase error:', error.message)
            return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 })
        }

        const { data: urlData } = supabase.storage
            .from('upload')
            .getPublicUrl(storagePath)

        return NextResponse.json({ success: true, url: urlData.publicUrl })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}
