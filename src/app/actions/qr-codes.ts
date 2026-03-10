'use server'

import { createClient } from '@/lib/supabase/server'

async function getAuthUserId() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    return { supabase, userId: user.id }
}

export async function moveQRToFolder(qrId: string, folderId: string | null) {
    const { supabase, userId } = await getAuthUserId()

    const { error } = await supabase
        .from('qr_codes')
        .update({ folder_id: folderId })
        .eq('id', qrId)
        .eq('user_id', userId)

    if (error) return { success: false, error: error.message }
    return { success: true }
}

export async function bulkMoveQRToFolder(qrIds: string[], folderId: string | null) {
    const { supabase, userId } = await getAuthUserId()

    const { error } = await supabase
        .from('qr_codes')
        .update({ folder_id: folderId })
        .in('id', qrIds)
        .eq('user_id', userId)

    if (error) return { success: false, error: error.message }
    return { success: true }
}

export async function bulkDeleteQRCodes(qrIds: string[]) {
    const { supabase, userId } = await getAuthUserId()

    const { error } = await supabase
        .from('qr_codes')
        .delete()
        .in('id', qrIds)
        .eq('user_id', userId)

    if (error) return { success: false, error: error.message }
    return { success: true }
}

const DEMO_QR_CODES = [
    {
        name: 'Site web',
        content_type: 'url',
        content_data: { url: 'https://traaaction.com' },
        style_config: {
            dotsStyle: { type: 'rounded', color: { type: 'single', color: '#111827' } },
            cornerSquaresStyle: { type: 'extra-rounded', color: { type: 'single', color: '#111827' } },
            cornerDotsStyle: { type: 'dot', color: { type: 'single', color: '#111827' } },
            background: { color: { type: 'single', color: '#ffffff' }, transparent: false },
            logo: { file: null, url: null, size: 0.2, margin: 5, shape: 'square' },
            errorCorrectionLevel: 'Q',
            qrSize: 300,
        },
        is_favorite: true,
        scan_count: 247,
    },
    {
        name: 'Landing page produit',
        content_type: 'url',
        content_data: { url: 'https://qr.traaaction.com' },
        style_config: {
            dotsStyle: { type: 'dots', color: { type: 'gradient', gradient: { type: 'linear', rotation: 135, colorStops: [{ offset: 0, color: '#7C3AED' }, { offset: 1, color: '#EC4899' }] } } },
            cornerSquaresStyle: { type: 'extra-rounded', color: { type: 'single', color: '#7C3AED' } },
            cornerDotsStyle: { type: 'dot', color: { type: 'single', color: '#EC4899' } },
            background: { color: { type: 'single', color: '#ffffff' }, transparent: false },
            logo: { file: null, url: null, size: 0.2, margin: 5, shape: 'square' },
            errorCorrectionLevel: 'Q',
            qrSize: 300,
        },
        is_favorite: false,
        scan_count: 183,
    },
    {
        name: 'Contact vCard',
        content_type: 'vcard',
        content_data: {
            firstName: 'Lucas',
            lastName: 'Traaaction',
            email: 'contact@traaaction.com',
            phone: '+33 1 23 45 67 89',
            company: 'Traaaction',
            title: 'Founder',
        },
        style_config: {
            dotsStyle: { type: 'classy-rounded', color: { type: 'single', color: '#1E40AF' } },
            cornerSquaresStyle: { type: 'extra-rounded', color: { type: 'single', color: '#1E40AF' } },
            cornerDotsStyle: { type: 'dot', color: { type: 'single', color: '#3B82F6' } },
            background: { color: { type: 'single', color: '#F0F9FF' }, transparent: false },
            logo: { file: null, url: null, size: 0.2, margin: 5, shape: 'square' },
            errorCorrectionLevel: 'Q',
            qrSize: 300,
        },
        is_favorite: false,
        scan_count: 56,
    },
    {
        name: 'Lien Instagram',
        content_type: 'url',
        content_data: { url: 'https://instagram.com/traaaction' },
        style_config: {
            dotsStyle: { type: 'rounded', color: { type: 'gradient', gradient: { type: 'linear', rotation: 45, colorStops: [{ offset: 0, color: '#F59E0B' }, { offset: 0.5, color: '#EF4444' }, { offset: 1, color: '#A855F7' }] } } },
            cornerSquaresStyle: { type: 'extra-rounded', color: { type: 'single', color: '#EF4444' } },
            cornerDotsStyle: { type: 'dot', color: { type: 'single', color: '#A855F7' } },
            background: { color: { type: 'single', color: '#ffffff' }, transparent: false },
            logo: { file: null, url: null, size: 0.2, margin: 5, shape: 'square' },
            errorCorrectionLevel: 'Q',
            qrSize: 300,
        },
        is_favorite: true,
        scan_count: 412,
    },
    {
        name: 'Menu restaurant',
        content_type: 'url',
        content_data: { url: 'https://example.com/menu' },
        style_config: {
            dotsStyle: { type: 'square', color: { type: 'single', color: '#78350F' } },
            cornerSquaresStyle: { type: 'square', color: { type: 'single', color: '#78350F' } },
            cornerDotsStyle: { type: 'square', color: { type: 'single', color: '#92400E' } },
            background: { color: { type: 'single', color: '#FFFBEB' }, transparent: false },
            logo: { file: null, url: null, size: 0.2, margin: 5, shape: 'square' },
            errorCorrectionLevel: 'Q',
            qrSize: 300,
        },
        is_favorite: false,
        scan_count: 89,
    },
    {
        name: 'Promo Black Friday',
        content_type: 'url',
        content_data: { url: 'https://example.com/promo' },
        style_config: {
            dotsStyle: { type: 'dots', color: { type: 'single', color: '#ffffff' } },
            cornerSquaresStyle: { type: 'extra-rounded', color: { type: 'single', color: '#ffffff' } },
            cornerDotsStyle: { type: 'dot', color: { type: 'single', color: '#F59E0B' } },
            background: { color: { type: 'single', color: '#111827' }, transparent: false },
            logo: { file: null, url: null, size: 0.2, margin: 5, shape: 'square' },
            errorCorrectionLevel: 'Q',
            qrSize: 300,
        },
        is_favorite: false,
        scan_count: 324,
    },
]

export async function seedDemoQRCodes() {
    const { supabase, userId } = await getAuthUserId()

    const rows = DEMO_QR_CODES.map((qr) => ({
        user_id: userId,
        name: qr.name,
        content_type: qr.content_type,
        content_data: qr.content_data,
        style_config: qr.style_config,
        is_favorite: qr.is_favorite,
        scan_count: qr.scan_count,
    }))

    const { error } = await supabase.from('qr_codes').insert(rows)
    if (error) return { success: false, error: error.message }
    return { success: true, count: rows.length }
}
