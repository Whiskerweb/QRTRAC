import { SignupForm } from '@/components/auth/SignupForm';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-[11px] tracking-tight">QR</span>
        </div>
        <span className="text-lg font-semibold">QR<span className="text-gray-400">.traaaction</span></span>
      </Link>
      <SignupForm />
    </div>
  );
}
