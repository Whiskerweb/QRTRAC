import { createClient } from '@/lib/supabase/server';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userId = user?.id ?? '';

  // Fetch initial stats server-side
  const [{ count: qrCount }, { data: scanData }, { count: favCount }] = await Promise.all([
    supabase.from('qr_codes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('qr_codes').select('scan_count').eq('user_id', userId),
    supabase.from('qr_codes').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_favorite', true),
  ]);

  const scanTotal = (scanData || []).reduce((sum, row) => sum + (row.scan_count || 0), 0);

  return (
    <DashboardContent
      initialQrCount={qrCount ?? 0}
      initialScanTotal={scanTotal}
      initialFavCount={favCount ?? 0}
    />
  );
}
