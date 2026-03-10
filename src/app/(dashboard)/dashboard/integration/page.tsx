'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer, springGentle } from '@/lib/animations'
import { Code, Copy, Check, Terminal, Webhook, Key, ChevronDown } from 'lucide-react'

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
                        {copied ? 'Copie' : 'Copier'}
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

function KeyDisplay({ label, value, masked = false }: { label: string; value: string; masked?: boolean }) {
    const [visible, setVisible] = useState(!masked)
    const [copied, setCopied] = useState(false)
    const handleCopy = () => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }
    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-mono text-gray-700 mt-0.5">
                    {visible ? value : value.slice(0, 8) + '••••••••••••••••'}
                </p>
            </div>
            <div className="flex items-center gap-2">
                {masked && (
                    <button
                        onClick={() => setVisible(!visible)}
                        className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        {visible ? 'Masquer' : 'Afficher'}
                    </button>
                )}
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
            </div>
        </div>
    )
}

export default function IntegrationPage() {
    const [sdkTab, setSdkTab] = useState<'typescript' | 'python'>('typescript')
    const [webhookOpen, setWebhookOpen] = useState(false)

    return (
        <motion.div
            className="max-w-3xl space-y-8"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
        >
            {/* Header */}
            <motion.div variants={fadeInUp} transition={springGentle}>
                <h1 className="text-2xl font-bold text-gray-900">Integration</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Connectez votre site pour tracker les conversions de vos liens marketing
                </p>
            </motion.div>

            {/* Section 1: Tracking Script */}
            <motion.section variants={fadeInUp} transition={springGentle} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                        <Code className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">1. Script de tracking</h2>
                        <p className="text-xs text-gray-400">Ajoutez ce script dans le &lt;head&gt; de votre site</p>
                    </div>
                </div>
                <div className="p-6">
                    <CopyBlock
                        filename="index.html"
                        code={`<!-- Traaaction Tracking -->
<script
  defer
  data-domain="votre-site.com"
  src="https://traaaction.com/trac.js"
></script>`}
                    />
                    <p className="text-xs text-gray-400 mt-3">
                        Ce script capture automatiquement les click IDs depuis vos liens courts et les transmet lors des conversions.
                    </p>
                </div>
            </motion.section>

            {/* Section 2: SDK */}
            <motion.section variants={fadeInUp} transition={springGentle} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                        <Terminal className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">2. SDK Backend</h2>
                        <p className="text-xs text-gray-400">Trackez leads et ventes depuis votre serveur</p>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    {/* Tab selector */}
                    <div className="inline-flex bg-gray-100 rounded-lg p-0.5">
                        <button
                            onClick={() => setSdkTab('typescript')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                sdkTab === 'typescript' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                            }`}
                        >
                            TypeScript
                        </button>
                        <button
                            onClick={() => setSdkTab('python')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                sdkTab === 'python' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                            }`}
                        >
                            Python
                        </button>
                    </div>

                    {sdkTab === 'typescript' ? (
                        <div className="space-y-3">
                            <CopyBlock code="npm install traaaction" />
                            <CopyBlock
                                filename="app/api/webhook/route.ts"
                                code={`import { Traaaction } from 'traaaction'

const trac = new Traaaction({
  apiKey: 'trac_live_xxx',   // Secret key
  publicKey: 'pk_xxx',       // Public key
})

// Track a lead
await trac.track.lead({
  clickId: 'clk_xxx',
  email: 'user@example.com',
})

// Track a sale (manual)
await trac.track.sale({
  clickId: 'clk_xxx',
  amount: 4900,        // in cents
  currency: 'eur',
  externalId: 'order_123',
})`}
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <CopyBlock code="pip install traaaction" />
                            <CopyBlock
                                filename="views.py"
                                code={`from traaaction import Traaaction

trac = Traaaction(
    api_key="trac_live_xxx",
    public_key="pk_xxx",
)

# Track a lead
trac.track.lead(
    click_id="clk_xxx",
    email="user@example.com",
)

# Track a sale (manual)
trac.track.sale(
    click_id="clk_xxx",
    amount=4900,
    currency="eur",
    external_id="order_123",
)`}
                            />
                        </div>
                    )}
                </div>
            </motion.section>

            {/* Section 3: API Keys */}
            <motion.section variants={fadeInUp} transition={springGentle} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                        <Key className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">3. Cles API</h2>
                        <p className="text-xs text-gray-400">Utilisez ces cles pour authentifier vos requetes</p>
                    </div>
                </div>
                <div className="px-6 py-4">
                    <KeyDisplay label="Public Key" value="pk_test_a1b2c3d4e5f6g7h8" />
                    <KeyDisplay label="Secret Key" value="trac_live_x9y8z7w6v5u4t3s2r1" masked />
                </div>
                <div className="px-6 pb-4">
                    <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                        La <strong>Public Key</strong> (pk_) est utilisee cote client pour le tracking.
                        La <strong>Secret Key</strong> (trac_live_) est utilisee cote serveur pour les operations sensibles.
                        Ne partagez jamais votre secret key.
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
                        <h2 className="text-sm font-semibold text-gray-900">4. Webhooks Stripe</h2>
                        <p className="text-xs text-gray-400">Automatisez le suivi des ventes via Stripe</p>
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
                            <p className="text-sm text-gray-600 mb-3">
                                Configurez un webhook Stripe pointant vers votre endpoint Traaaction pour tracker automatiquement les ventes.
                            </p>
                            <CopyBlock
                                filename="Endpoint URL"
                                code="https://traaaction.com/api/webhooks/{votre-endpoint-id}"
                            />
                        </div>

                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Events requis</p>
                            <div className="space-y-1.5">
                                {[
                                    { event: 'checkout.session.completed', desc: 'Premiere vente ou abonnement' },
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

                        <p className="text-xs text-gray-400">
                            N&apos;oubliez pas d&apos;ajouter <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">tracClickId</code> dans les metadata de votre checkout session pour l&apos;attribution.
                        </p>
                    </div>
                )}
            </motion.section>
        </motion.div>
    )
}
