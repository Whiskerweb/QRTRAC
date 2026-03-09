'use client';

import type { QREditorState, ColorConfig } from '@/types/qr';

function buildColorConfig(color: ColorConfig) {
  if (color.type === 'single') {
    return { color: color.color };
  }
  if (color.type === 'linearGradient') {
    return {
      gradient: {
        type: 'linear' as const,
        rotation: color.rotation,
        colorStops: [
          { offset: 0, color: color.colors[0] },
          { offset: 1, color: color.colors[1] },
        ],
      },
    };
  }
  // radialGradient
  return {
    gradient: {
      type: 'radial' as const,
      colorStops: [
        { offset: 0, color: color.colors[0] },
        { offset: 1, color: color.colors[1] },
      ],
    },
  };
}

export function buildQRData(state: QREditorState): string {
  const { contentType, contentData } = state;

  switch (contentType) {
    case 'url':
      return contentData.url || 'https://example.com';
    case 'text':
      return contentData.text || '';
    case 'vcard':
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${contentData.firstName || ''} ${contentData.lastName || ''}`,
        `TEL:${contentData.phone || ''}`,
        `EMAIL:${contentData.email || ''}`,
        `ORG:${contentData.organization || ''}`,
        `URL:${contentData.website || ''}`,
        'END:VCARD',
      ].join('\n');
    default:
      return contentData.text || '';
  }
}

export function buildQROptions(state: QREditorState, size = 300) {
  const data = buildQRData(state);

  return {
    width: size,
    height: size,
    data,
    qrOptions: {
      errorCorrectionLevel: state.errorCorrectionLevel,
    },
    dotsOptions: {
      type: state.dotsStyle.type,
      ...buildColorConfig(state.dotsStyle.color),
    },
    cornersSquareOptions: {
      type: state.cornerSquaresStyle.type,
      ...buildColorConfig(state.cornerSquaresStyle.color),
    },
    cornersDotOptions: {
      type: state.cornerDotsStyle.type,
      ...buildColorConfig(state.cornerDotsStyle.color),
    },
    backgroundOptions: state.background.transparent
      ? { color: 'transparent' }
      : buildColorConfig(state.background.color),
    ...(state.logo.url ? { image: state.logo.url } : {}),
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: state.logo.size,
      margin: state.logo.margin,
      crossOrigin: 'anonymous',
    },
  };
}
