'use client';

import { useEffect, useRef, useCallback } from 'react';
import type QRCodeStyling from 'qr-code-styling';
import type { QREditorState } from '@/types/qr';
import { buildQROptions } from '@/lib/qr/generator';

interface QRPreviewProps {
  state: QREditorState;
  size?: number;
  onInstanceReady?: (instance: QRCodeStyling) => void;
}

export function QRPreview({ state, size = 300, onInstanceReady }: QRPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const qrInstance = useRef<QRCodeStyling | null>(null);

  const initQR = useCallback(async () => {
    if (!ref.current) return;

    const QRCodeStylingLib = (await import('qr-code-styling')).default;
    const options = buildQROptions(state, size);

    if (!qrInstance.current) {
      qrInstance.current = new QRCodeStylingLib(options);
      qrInstance.current.append(ref.current);
      onInstanceReady?.(qrInstance.current);
    } else {
      qrInstance.current.update(options);
    }
  }, [state, size, onInstanceReady]);

  useEffect(() => {
    initQR();
  }, [initQR]);

  return (
    <div
      ref={ref}
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    />
  );
}
