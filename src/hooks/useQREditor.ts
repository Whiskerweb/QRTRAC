'use client';

import { useState, useCallback } from 'react';
import type { QREditorState, ColorConfig, ContentType } from '@/types/qr';

const DEFAULT_STATE: QREditorState = {
  contentType: 'url',
  contentData: { url: 'https://exemple.com' },
  dotsStyle: {
    type: 'rounded',
    color: { type: 'single', color: '#000000' },
  },
  cornerSquaresStyle: {
    type: 'extra-rounded',
    color: { type: 'single', color: '#000000' },
  },
  cornerDotsStyle: {
    type: 'dot',
    color: { type: 'single', color: '#000000' },
  },
  background: {
    color: { type: 'single', color: '#ffffff' },
    transparent: false,
  },
  logo: {
    file: null,
    url: null,
    size: 0.2,
    margin: 5,
    shape: 'square',
  },
  exportConfig: {
    format: 'png',
    resolution: 1000,
  },
  name: 'Mon QR Code',
  errorCorrectionLevel: 'Q',
  qrSize: 300,
};

export function useQREditor(initialState?: Partial<QREditorState>) {
  const [state, setState] = useState<QREditorState>({
    ...DEFAULT_STATE,
    ...initialState,
  });

  const update = useCallback((updates: Partial<QREditorState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const setContentType = useCallback((contentType: ContentType) => {
    const defaultData: Record<ContentType, Record<string, string>> = {
      url: { url: 'https://exemple.com' },
      text: { text: '' },
      vcard: {
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        organization: '',
        website: '',
      },
    };
    setState((prev) => ({
      ...prev,
      contentType,
      contentData: defaultData[contentType],
    }));
  }, []);

  const setDotsColor = useCallback((color: ColorConfig) => {
    setState((prev) => ({
      ...prev,
      dotsStyle: { ...prev.dotsStyle, color },
    }));
  }, []);

  const setCornersColor = useCallback((color: ColorConfig) => {
    setState((prev) => ({
      ...prev,
      cornerSquaresStyle: { ...prev.cornerSquaresStyle, color },
    }));
  }, []);

  const setCornerDotsColor = useCallback((color: ColorConfig) => {
    setState((prev) => ({
      ...prev,
      cornerDotsStyle: { ...prev.cornerDotsStyle, color },
    }));
  }, []);

  const applyTemplate = useCallback((config: Partial<QREditorState>) => {
    setState((prev) => ({ ...prev, ...config }));
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  return {
    state,
    update,
    setContentType,
    setDotsColor,
    setCornersColor,
    setCornerDotsColor,
    applyTemplate,
    reset,
  };
}
