'use client'

import { useEffect, useRef } from 'react'
import type { QRCodeRecord } from '@/types/qr'

interface QRCardPreviewProps {
    qr: QRCodeRecord
    size?: number
}

/** Lightweight QR preview for dashboard cards — renders via qr-code-styling */
export function QRCardPreview({ qr, size = 120 }: QRCardPreviewProps) {
    const ref = useRef<HTMLDivElement>(null)
    const instanceRef = useRef<unknown>(null)

    useEffect(() => {
        if (!ref.current) return

        let cancelled = false

        const render = async () => {
            const { buildQROptions, buildQRData } = await import('@/lib/qr/generator')
            const QRCodeStyling = (await import('qr-code-styling')).default

            if (cancelled || !ref.current) return

            // Build a minimal QREditorState from the record
            const state = {
                ...qr.style_config,
                contentType: qr.content_type,
                contentData: qr.content_data,
                name: qr.name,
                exportConfig: { format: 'png' as const, resolution: size },
                logo: {
                    ...qr.style_config.logo,
                    file: null,
                },
            }

            const options = buildQROptions(state, size)

            if (!instanceRef.current) {
                const instance = new QRCodeStyling(options)
                instanceRef.current = instance
                instance.append(ref.current)
            }
        }

        render()

        return () => { cancelled = true }
    }, [qr.id]) // only re-render if QR changes

    return (
        <div
            ref={ref}
            className="flex items-center justify-center"
            style={{ width: size, height: size }}
        />
    )
}
