import { QRCodeGrid } from '@/components/dashboard/QRCodeGrid';
import { createClient } from '@/lib/supabase/server';
import { QrCode } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { count: qrCount } = await supabase
    .from('qr_codes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id ?? '');

  const { count: favCount } = await supabase
    .from('qr_codes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id ?? '')
    .eq('is_favorite', true);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">Mes QR Codes</h1>
        <p className="text-[13px] text-gray-400 mt-1">
          Gerez, editez et telechargez vos QR codes
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100">
          <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
            <QrCode className="w-4 h-4 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 leading-tight">{qrCount ?? 0}</p>
            <p className="text-[11px] text-gray-400">QR codes</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 leading-tight">{favCount ?? 0}</p>
            <p className="text-[11px] text-gray-400">Favoris</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <QRCodeGrid />
    </div>
  );
}
