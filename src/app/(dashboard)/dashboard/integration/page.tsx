'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer, springGentle } from '@/lib/animations'
import { Code, Copy, Check, Terminal, Webhook, Key, ChevronDown, ArrowRight, ExternalLink } from 'lucide-react'

function CopyBlock({ code, filename }: { code: string; filename?: string }) {
    const [copied, setCopied] = useState(false)
    const handleCopy = () => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }
    return (
        <div className="relative group rounded-xl overflow-hidden border border-gray-200">
            {filename && (
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-gray-500">{filename}</span>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copié' : 'Copier'}
                    </button>
                </div>
            )}
            <pre className="bg-gray-950 text-gray-300 p-4 text-[13px] leading-relaxed font-mono overflow-x-auto">
                <code>{code}</code>
            </pre>
            {!filename && (
                <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 p-1.5 rounded-md bg-gray-800 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
            )}
        </div>
    )
}

type Framework = 'nextjs' | 'django' | 'flask' | 'fastapi'

const FRAMEWORKS: { id: Framework; label: string; install: string }[] = [
    { id: 'nextjs', label: 'Next.js', install: 'npm install traaaction' },
    { id: 'django', label: 'Django', install: 'pip install "traaaction[django]"' },
    { id: 'flask', label: 'Flask', install: 'pip install "traaaction[flask]"' },
    { id: 'fastapi', label: 'FastAPI', install: 'pip install "traaaction[fastapi]"' },
]

const SDK_EXAMPLES: Record<Framework, { filename: string; code: string }> = {
    nextjs: {
        filename: 'app/api/webhook/route.ts',
        code: `import { Traaaction } from 'traaaction'
import { getClickId } from 'traaaction/server'

const trac = new Traaaction({
  apiKey: 'trac_live_xxx',
  publicKey: 'pk_xxx',
})

// Track a lead
export async function POST(req: Request) {
  const clickId = getClickId(req)
  await trac.track.lead({
    clickId,
    email: 'user@example.com',
  })
}`,
    },
    django: {
        filename: 'views.py',
        code: `from traaaction import Traaaction
from traaaction.django import get_click_id

trac = Traaaction(
    api_key="trac_live_xxx",
    public_key="pk_xxx",
)

def track_lead(request):
    click_id = get_click_id(request)
    trac.track.lead(
        click_id=click_id,
        email="user@example.com",
    )`,
    },
    flask: {
        filename: 'app.py',
        code: `from traaaction import Traaaction
from traaaction.flask import get_click_id

trac = Traaaction(
    api_key="trac_live_xxx",
    public_key="pk_xxx",
)

@app.route("/track-lead", methods=["POST"])
def track_lead():
    click_id = get_click_id()
    trac.track.lead(
        click_id=click_id,
        email="user@example.com",
    )`,
    },
    fastapi: {
        filename: 'main.py',
        code: `from traaaction import Traaaction
from traaaction.fastapi import get_click_id
from fastapi import Depends

trac = Traaaction(
    api_key="trac_live_xxx",
    public_key="pk_xxx",
)

@app.post("/track-lead")
async def track_lead(click_id: str = Depends(get_click_id)):
    trac.track.lead(
        click_id=click_id,
        email="user@example.com",
    )`,
    },
}

export default function IntegrationPage() {
    const [framework, setFramework] = useState<Framework>('nextjs')
    const [webhookOpen, setWebhookOpen] = useState(false)

    const currentFramework = FRAMEWORKS.find(f => f.id === framework)!
    const sdkExample = SDK_EXAMPLES[framework]

    return (
        <motion.div
            className="max-w-3xl space-y-8"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
        >
            {/* Header */}
            <motion.div variants={fadeInUp} transition={springGentle}>
                <h1 className="text-xl font-bold text-gray-900">Intégration</h1>
                <p className="text-[13px] text-gray-400 mt-1">
                    Connectez votre site pour tracker les conversions de vos liens marketing
                </p>
            </motion.div>

            {/* Tracking chain */}
            <motion.div variants={fadeInUp} transition={springGentle}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Chaîne de tracking</p>
                <div className="flex items-stretch gap-2">
                    {[
                        { label: 'Clic', method: 'trac.js', desc: 'Capture automatique du click ID' },
                        { label: 'Lead', method: 'SDK / API', desc: 'Inscription ou action utilisateur' },
                        { label: 'Vente', method: 'Webhook / API', desc: 'Paiement confirmé via Stripe' },
                    ].map((step, i) => (
                        <div key={step.label} className="contents">
                            <div className="flex-1 bg-white border border-gray-200 rounded-xl p-3.5 text-center">
                                <p className="text-[13px] font-semibold text-gray-900">{step.label}</p>
                                <p className="text-[11px] font-mono text-gray-400 mt-0.5">{step.method}</p>
                                <p className="text-[11px] text-gray-400 mt-1 leading-snug">{step.desc}</p>
                            </div>
                            {i < 2 && (
                                <div className="flex items-center px-0.5 text-gray-300">
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Section 1: Tracking Script */}
            <motion.section variants={fadeInUp} transition={springGentle} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                        <Code className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="text-[13px] font-semibold text-gray-900">1. Script de tracking</h2>
                        <p className="text-[11px] text-gray-400">Ajoutez ce script dans le &lt;head&gt; de votre site</p>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <CopyBlock
                        filename="index.html"
                        code={`<!-- Traaaction Tracking -->
<script
  defer
  data-domain="votre-site.com"
  src="https://traaaction.com/trac.js"
></script>`}
                    />
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                        Ce script capture automatiquement les click IDs depuis vos liens courts et les transmet lors des conversions.
                    </p>

                    {/* Proxy recommendation */}
                    <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                        <p className="text-[11px] font-semibold text-gray-600 mb-1">Recommandé : Proxy first-party</p>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                            Pour éviter les bloqueurs de publicité, configurez un proxy sur votre domaine.
                            Redirigez <code className="bg-gray-200 px-1 rounded text-[10px]">/_trac/script.js</code> vers{' '}
                            <code className="bg-gray-200 px-1 rounded text-[10px]">traaaction.com/trac.js</code> et{' '}
                            <code className="bg-gray-200 px-1 rounded text-[10px]">/_trac/api/*</code> vers{' '}
                            <code className="bg-gray-200 px-1 rounded text-[10px]">traaaction.com/api/*</code>.
                        </p>
                    </div>
                </div>
            </motion.section>

            {/* Section 2: SDK */}
            <motion.section variants={fadeInUp} transition={springGentle} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                        <Terminal className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="text-[13px] font-semibold text-gray-900">2. SDK Backend</h2>
                        <p className="text-[11px] text-gray-400">Trackez leads et ventes depuis votre serveur</p>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    {/* Framework selector */}
                    <div className="inline-flex bg-gray-100 rounded-lg p-0.5">
                        {FRAMEWORKS.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFramework(f.id)}
                                className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                                    framework === f.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <CopyBlock code={currentFramework.install} />
                    <CopyBlock filename={sdkExample.filename} code={sdkExample.code} />
                </div>
            </motion.section>

            {/* Section 3: API Keys */}
            <motion.section variants={fadeInUp} transition={springGentle} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                        <Key className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="text-[13px] font-semibold text-gray-900">3. Clés API</h2>
                        <p className="text-[11px] text-gray-400">Gérez vos clés depuis le dashboard Traaaction</p>
                    </div>
                </div>
                <div className="px-6 py-5">
                    <div className="bg-gray-50 rounded-xl px-4 py-4 border border-gray-100 space-y-3">
                        <p className="text-[13px] text-gray-600 leading-relaxed">
                            Vos clés API sont gérées depuis votre dashboard principal Traaaction.
                            Vous y trouverez votre <strong>Public Key</strong> (pk_) pour le tracking client
                            et votre <strong>Secret Key</strong> (trac_live_) pour les opérations serveur.
                        </p>
                        <a
                            href="https://app.traaaction.com/dashboard/settings?tab=integration"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors"
                        >
                            Gérer mes clés API
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-3">
                        Ne partagez jamais votre Secret Key. Utilisez la Public Key côté client et la Secret Key uniquement côté serveur.
                    </p>
                </div>
            </motion.section>

            {/* Section 4: Webhooks */}
            <motion.section variants={fadeInUp} transition={springGentle} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                        <Webhook className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-[13px] font-semibold text-gray-900">4. Webhooks Stripe</h2>
                        <p className="text-[11px] text-gray-400">Automatisez le suivi des ventes via Stripe</p>
                    </div>
                    <button
                        onClick={() => setWebhookOpen(!webhookOpen)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${webhookOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>
                {webhookOpen && (
                    <div className="p-6 space-y-4">
                        <div>
                            <p className="text-[13px] text-gray-600 mb-3">
                                Configurez un webhook Stripe pointant vers votre endpoint Traaaction pour tracker automatiquement les ventes.
                            </p>
                            <CopyBlock
                                filename="Endpoint URL"
                                code="https://traaaction.com/api/webhooks/{votre-endpoint-id}"
                            />
                        </div>

                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Events requis</p>
                            <div className="space-y-1.5">
                                {[
                                    { event: 'checkout.session.completed', desc: 'Première vente ou abonnement' },
                                    { event: 'invoice.paid', desc: 'Renouvellements abonnement' },
                                    { event: 'charge.refunded', desc: 'Remboursements' },
                                    { event: 'customer.subscription.deleted', desc: 'Annulations abonnement' },
                                ].map(({ event, desc }) => (
                                    <div key={event} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                                        <code className="text-[12px] font-mono text-gray-700 font-medium">{event}</code>
                                        <span className="text-[11px] text-gray-400">{desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                N&apos;oubliez pas d&apos;ajouter <code className="bg-gray-200 px-1 py-0.5 rounded text-[10px]">tracClickId</code> dans
                                les metadata de votre checkout session pour l&apos;attribution. Mode <code className="bg-gray-200 px-1 py-0.5 rounded text-[10px]">payment</code> pour
                                les achats one-time, <code className="bg-gray-200 px-1 py-0.5 rounded text-[10px]">subscription</code> pour les abonnements.
                            </p>
                        </div>
                    </div>
                )}
            </motion.section>
        </motion.div>
    )
}
