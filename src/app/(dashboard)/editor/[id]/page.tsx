'use client';

import dynamic from 'next/dynamic';
import { use } from 'react';

const QREditor = dynamic(() => import('@/components/editor/QREditor').then(m => ({ default: m.QREditor })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground">Chargement de l&apos;éditeur...</div>
    </div>
  ),
});

export default function EditQRPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <QREditor qrId={id} />;
}
