'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Building2, User, Eye, EyeOff, Mail, Loader2 } from 'lucide-react';

type UserType = 'startup' | 'particulier' | null;
type Mode = 'login' | 'signup';
type ViewState = 'role-select' | 'form' | 'confirmation-pending' | 'forgot-password' | 'reset-sent';

function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -80 : 80, opacity: 0 }),
};

export function LoginForm() {
    const router = useRouter();
    const supabase = createClient();

    const [userType, setUserType] = useState<UserType>(null);
    const [mode, setMode] = useState<Mode>('login');
    const [viewState, setViewState] = useState<ViewState>('role-select');
    const [direction, setDirection] = useState(1);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

    const goTo = (state: ViewState, dir = 1) => {
        setDirection(dir);
        setError('');
        setViewState(state);
    };

    const handleSelectRole = (type: UserType) => {
        setUserType(type);
        goTo('form', 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (mode === 'signup') {
            const { error: err } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName,
                        user_type: userType,
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (err) {
                setError(err.message);
            } else {
                goTo('confirmation-pending', 1);
            }
        } else {
            const { error: err } = await supabase.auth.signInWithPassword({ email, password });
            if (err) {
                setError(err.message);
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        }
        setLoading(false);
    };

    const handleGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetLoading(true);
        setError('');
        const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail, {
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
        if (err) {
            setError(err.message);
        } else {
            goTo('reset-sent', 1);
        }
        setResetLoading(false);
    };

    const inputClass = 'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-all';

    return (
        <div className="w-full max-w-sm mx-auto">
            <AnimatePresence mode="wait" custom={direction}>
                {/* Role selection */}
                {viewState === 'role-select' && (
                    <motion.div
                        key="role-select"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="space-y-6"
                    >
                        <div className="text-center">
                            <h1 className="text-xl font-bold text-gray-900">Bienvenue</h1>
                            <p className="text-[13px] text-gray-400 mt-1">Choisissez votre profil pour continuer</p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleSelectRole('startup')}
                                className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-left group"
                            >
                                <div className="w-11 h-11 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
                                    <Building2 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-[14px] font-semibold text-gray-900 group-hover:text-gray-700">Startup</p>
                                    <p className="text-[12px] text-gray-400">Créez des QR codes pour votre entreprise</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleSelectRole('particulier')}
                                className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-left group"
                            >
                                <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <User className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-[14px] font-semibold text-gray-900 group-hover:text-gray-700">Particulier</p>
                                    <p className="text-[12px] text-gray-400">Usage personnel, projets, événements</p>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Login / Signup form */}
                {viewState === 'form' && (
                    <motion.div
                        key="form"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="space-y-5"
                    >
                        <div>
                            <button
                                onClick={() => goTo('role-select', -1)}
                                className="flex items-center gap-1 text-[13px] text-gray-400 hover:text-gray-600 transition-colors mb-4"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Retour
                            </button>
                            <h1 className="text-xl font-bold text-gray-900">
                                {mode === 'login' ? 'Connexion' : 'Créer un compte'}
                            </h1>
                            <p className="text-[13px] text-gray-400 mt-1">
                                {mode === 'login'
                                    ? 'Connectez-vous à votre compte'
                                    : 'Commencez à créer des QR codes design'}
                            </p>
                        </div>

                        {/* Google */}
                        <button
                            onClick={handleGoogle}
                            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                        >
                            <GoogleIcon className="w-4 h-4" />
                            Continuer avec Google
                        </button>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-background px-3 text-[11px] uppercase tracking-wider text-gray-300">ou</span>
                            </div>
                        </div>

                        {/* Email form */}
                        <form onSubmit={handleSubmit} className="space-y-3.5">
                            {mode === 'signup' && (
                                <div className="space-y-1.5">
                                    <label className="text-[13px] text-gray-500">Nom</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Votre nom"
                                        className={inputClass}
                                    />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[13px] text-gray-500">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="vous@exemple.com"
                                    required
                                    className={inputClass}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[13px] text-gray-500">Mot de passe</label>
                                    {mode === 'login' && (
                                        <button
                                            type="button"
                                            onClick={() => { setResetEmail(email); goTo('forgot-password', 1) }}
                                            className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            Mot de passe oublié ?
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={mode === 'signup' ? 'Minimum 8 caractères' : '••••••••'}
                                        required
                                        minLength={mode === 'signup' ? 8 : undefined}
                                        className={`${inputClass} pr-10`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <p className="text-[12px] text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all"
                            >
                                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                            </button>
                        </form>

                        {/* Toggle mode */}
                        <p className="text-center text-[13px] text-gray-400">
                            {mode === 'login' ? (
                                <>
                                    Pas encore de compte ?{' '}
                                    <button
                                        onClick={() => { setMode('signup'); setError('') }}
                                        className="text-gray-700 font-medium hover:underline"
                                    >
                                        Créer un compte
                                    </button>
                                </>
                            ) : (
                                <>
                                    Déjà un compte ?{' '}
                                    <button
                                        onClick={() => { setMode('login'); setError('') }}
                                        className="text-gray-700 font-medium hover:underline"
                                    >
                                        Se connecter
                                    </button>
                                </>
                            )}
                        </p>
                    </motion.div>
                )}

                {/* Confirmation pending */}
                {viewState === 'confirmation-pending' && (
                    <motion.div
                        key="confirmation"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="text-center space-y-4"
                    >
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto">
                            <Mail className="w-7 h-7 text-gray-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Vérifiez votre email</h2>
                            <p className="text-[13px] text-gray-400 mt-1">
                                Un lien de confirmation a été envoyé à <strong className="text-gray-600">{email}</strong>
                            </p>
                        </div>
                        <button
                            onClick={() => goTo('form', -1)}
                            className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Retour à la connexion
                        </button>
                    </motion.div>
                )}

                {/* Forgot password */}
                {viewState === 'forgot-password' && (
                    <motion.div
                        key="forgot"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="space-y-5"
                    >
                        <div>
                            <button
                                onClick={() => goTo('form', -1)}
                                className="flex items-center gap-1 text-[13px] text-gray-400 hover:text-gray-600 transition-colors mb-4"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Retour
                            </button>
                            <h1 className="text-xl font-bold text-gray-900">Mot de passe oublié</h1>
                            <p className="text-[13px] text-gray-400 mt-1">
                                Entrez votre email pour recevoir un lien de réinitialisation
                            </p>
                        </div>

                        <form onSubmit={handleResetPassword} className="space-y-3.5">
                            <div className="space-y-1.5">
                                <label className="text-[13px] text-gray-500">Email</label>
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    placeholder="vous@exemple.com"
                                    required
                                    className={inputClass}
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <p className="text-[12px] text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={resetLoading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all"
                            >
                                {resetLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                Envoyer le lien
                            </button>
                        </form>
                    </motion.div>
                )}

                {/* Reset email sent */}
                {viewState === 'reset-sent' && (
                    <motion.div
                        key="reset-sent"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="text-center space-y-4"
                    >
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto">
                            <Mail className="w-7 h-7 text-gray-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Email envoyé</h2>
                            <p className="text-[13px] text-gray-400 mt-1">
                                Un lien de réinitialisation a été envoyé à <strong className="text-gray-600">{resetEmail}</strong>
                            </p>
                        </div>
                        <button
                            onClick={() => { setMode('login'); goTo('form', -1) }}
                            className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Retour à la connexion
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
