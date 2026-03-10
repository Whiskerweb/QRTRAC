import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Temporary seed route - DELETE AFTER USE
// Only works for the specific admin email
const ADMIN_EMAIL = 'lucasroncey07@gmail.com'

const QR_CODES_DEMO = [
    {
        name: 'Facebook Ads - Promo Ete',
        content_type: 'url',
        content_data: { url: 'https://facebook.com/ads/promo-ete-2026' },
        style_config: {
            dotsStyle: { type: 'rounded', color: { type: 'single', color: '#1877F2' } },
            cornerSquaresStyle: { type: 'extra-rounded', color: { type: 'single', color: '#1877F2' } },
            cornerDotsStyle: { type: 'dot', color: { type: 'single', color: '#1877F2' } },
            background: { color: { type: 'single', color: '#FFFFFF' }, transparent: false },
            errorCorrectionLevel: 'M',
            qrSize: 280,
            logo: { url: null, size: 0.2, margin: 5, shape: 'rounded' },
        },
        is_favorite: true,
    },
    {
        name: 'Instagram Bio Link',
        content_type: 'url',
        content_data: { url: 'https://instagram.com/traaaction_official' },
        style_config: {
            dotsStyle: { type: 'dots', color: { type: 'linear-gradient', colors: ['#833AB4', '#FD1D1D'], rotation: 45 } },
            cornerSquaresStyle: { type: 'dot', color: { type: 'single', color: '#833AB4' } },
            cornerDotsStyle: { type: 'dot', color: { type: 'single', color: '#FD1D1D' } },
            background: { color: { type: 'single', color: '#FFFFFF' }, transparent: false },
            errorCorrectionLevel: 'M',
            qrSize: 280,
            logo: { url: null, size: 0.2, margin: 5, shape: 'circle' },
        },
        is_favorite: true,
    },
    {
        name: 'Landing Page - Launch',
        content_type: 'url',
        content_data: { url: 'https://traaaction.com/launch' },
        style_config: {
            dotsStyle: { type: 'classy-rounded', color: { type: 'single', color: '#111111' } },
            cornerSquaresStyle: { type: 'extra-rounded', color: { type: 'single', color: '#111111' } },
            cornerDotsStyle: { type: 'dot', color: { type: 'single', color: '#111111' } },
            background: { color: { type: 'single', color: '#FFFFFF' }, transparent: false },
            errorCorrectionLevel: 'H',
            qrSize: 280,
            logo: { url: null, size: 0.25, margin: 5, shape: 'rounded' },
        },
        is_favorite: false,
    },
    {
        name: 'LinkedIn Post - Recrutement',
        content_type: 'url',
        content_data: { url: 'https://linkedin.com/company/traaaction/jobs' },
        style_config: {
            dotsStyle: { type: 'rounded', color: { type: 'single', color: '#0A66C2' } },
            cornerSquaresStyle: { type: 'extra-rounded', color: { type: 'single', color: '#0A66C2' } },
            cornerDotsStyle: { type: 'dot', color: { type: 'single', color: '#0A66C2' } },
            background: { color: { type: 'single', color: '#F3F6F8' }, transparent: false },
            errorCorrectionLevel: 'M',
            qrSize: 280,
            logo: { url: null, size: 0.2, margin: 5, shape: 'square' },
        },
        is_favorite: false,
    },
    {
        name: 'TikTok - Code Promo',
        content_type: 'url',
        content_data: { url: 'https://tiktok.com/@traaaction/promo' },
        style_config: {
            dotsStyle: { type: 'extra-rounded', color: { type: 'single', color: '#000000' } },
            cornerSquaresStyle: { type: 'dot', color: { type: 'single', color: '#FE2C55' } },
            cornerDotsStyle: { type: 'dot', color: { type: 'single', color: '#25F4EE' } },
            background: { color: { type: 'single', color: '#FFFFFF' }, transparent: false },
            errorCorrectionLevel: 'M',
            qrSize: 280,
            logo: { url: null, size: 0.2, margin: 5, shape: 'rounded' },
        },
        is_favorite: true,
    },
    {
        name: 'Contact VCard - Lucas',
        content_type: 'vcard',
        content_data: {
            firstName: 'Lucas',
            lastName: 'Roncey',
            phone: '+33 6 12 34 56 78',
            email: 'lucas@traaaction.com',
            organization: 'Traaaction',
            website: 'https://traaaction.com',
        },
        style_config: {
            dotsStyle: { type: 'classy', color: { type: 'single', color: '#2D3436' } },
            cornerSquaresStyle: { type: 'classy', color: { type: 'single', color: '#2D3436' } },
            cornerDotsStyle: { type: 'dot', color: { type: 'single', color: '#6C5CE7' } },
            background: { color: { type: 'single', color: '#FAFAFA' }, transparent: false },
            errorCorrectionLevel: 'H',
            qrSize: 280,
            logo: { url: null, size: 0.2, margin: 5, shape: 'circle' },
        },
        is_favorite: false,
    },
    {
        name: 'Newsletter Signup',
        content_type: 'url',
        content_data: { url: 'https://traaaction.com/newsletter' },
        style_config: {
            dotsStyle: { type: 'rounded', color: { type: 'single', color: '#E74C3C' } },
            cornerSquaresStyle: { type: 'extra-rounded', color: { type: 'single', color: '#E74C3C' } },
            cornerDotsStyle: { type: 'dot', color: { type: 'single', color: '#C0392B' } },
            background: { color: { type: 'single', color: '#FFF5F5' }, transparent: false },
            errorCorrectionLevel: 'M',
            qrSize: 280,
            logo: { url: null, size: 0.2, margin: 5, shape: 'rounded' },
        },
        is_favorite: false,
    },
    {
        name: 'Google Ads - Retargeting',
        content_type: 'url',
        content_data: { url: 'https://traaaction.com/utm?source=google&medium=cpc' },
        style_config: {
            dotsStyle: { type: 'square', color: { type: 'single', color: '#4285F4' } },
            cornerSquaresStyle: { type: 'square', color: { type: 'single', color: '#34A853' } },
            cornerDotsStyle: { type: 'dot', color: { type: 'single', color: '#FBBC05' } },
            background: { color: { type: 'single', color: '#FFFFFF' }, transparent: false },
            errorCorrectionLevel: 'M',
            qrSize: 280,
            logo: { url: null, size: 0.2, margin: 5, shape: 'rounded' },
        },
        is_favorite: false,
    },
    {
        name: 'Flyer Salon Pro 2026',
        content_type: 'url',
        content_data: { url: 'https://traaaction.com/salon-pro-2026' },
        style_config: {
            dotsStyle: { type: 'classy-rounded', color: { type: 'single', color: '#2ECC71' } },
            cornerSquaresStyle: { type: 'classy-rounded', color: { type: 'single', color: '#27AE60' } },
            cornerDotsStyle: { type: 'dot', color: { type: 'single', color: '#2ECC71' } },
            background: { color: { type: 'single', color: '#FFFFFF' }, transparent: false },
            errorCorrectionLevel: 'M',
            qrSize: 280,
            logo: { url: null, size: 0.2, margin: 5, shape: 'rounded' },
        },
        is_favorite: true,
    },
    {
        name: 'Menu Restaurant QR',
        content_type: 'url',
        content_data: { url: 'https://menu.example.com/la-brasserie' },
        style_config: {
            dotsStyle: { type: 'dots', color: { type: 'single', color: '#8B4513' } },
            cornerSquaresStyle: { type: 'dot', color: { type: 'single', color: '#8B4513' } },
            cornerDotsStyle: { type: 'dot', color: { type: 'single', color: '#D2691E' } },
            background: { color: { type: 'single', color: '#FFF8DC' }, transparent: false },
            errorCorrectionLevel: 'M',
            qrSize: 280,
            logo: { url: null, size: 0.2, margin: 5, shape: 'rounded' },
        },
        is_favorite: false,
    },
]

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== ADMIN_EMAIL) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results: string[] = []

    // Check existing QR codes
    const { data: existing } = await supabase
        .from('qr_codes')
        .select('name')
        .eq('user_id', user.id)

    const existingNames = new Set((existing || []).map(q => q.name))

    // Insert QR codes
    for (const qr of QR_CODES_DEMO) {
        if (existingNames.has(qr.name)) {
            results.push(`SKIP: ${qr.name} (already exists)`)
            continue
        }

        const daysAgo = Math.floor(Math.random() * 60) + 1
        const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
        const updatedAt = new Date(Date.now() - Math.floor(Math.random() * daysAgo) * 24 * 60 * 60 * 1000).toISOString()

        const { error } = await supabase.from('qr_codes').insert({
            user_id: user.id,
            name: qr.name,
            content_type: qr.content_type,
            content_data: qr.content_data,
            style_config: qr.style_config,
            logo_path: null,
            thumbnail_url: null,
            is_favorite: qr.is_favorite,
            created_at: createdAt,
            updated_at: updatedAt,
        })

        if (error) {
            results.push(`ERROR: ${qr.name} - ${error.message}`)
        } else {
            results.push(`OK: ${qr.name}`)
        }
    }

    return NextResponse.json({
        user_id: user.id,
        email: user.email,
        results,
    })
}
