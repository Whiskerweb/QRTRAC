import { QRCodeGrid } from '@/components/dashboard/QRCodeGrid';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes QR Codes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gerez et creez vos QR codes design
        </p>
      </div>
      <QRCodeGrid />
    </div>
  );
}
