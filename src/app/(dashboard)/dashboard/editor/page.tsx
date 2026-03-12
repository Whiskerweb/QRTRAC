'use client';

import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const QREditor = dynamic(() => import('@/components/editor/QREditor').then(m => ({ default: m.QREditor })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground">Chargement de l&apos;éditeur...</div>
    </div>
  ),
});

function EditorWithParams() {
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get('url') || undefined;

  return <QREditor initialUrl={initialUrl} />;
}

export default function NewEditorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    }>
      <EditorWithParams />
    </Suspense>
  );
}
