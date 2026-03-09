import type { QRTemplate } from '@/types/qr';

export const QR_TEMPLATES: QRTemplate[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    preview: '⬛',
    config: {
      dotsStyle: {
        type: 'rounded',
        color: { type: 'single', color: '#000000' },
      },
      cornerSquaresStyle: {
        type: 'square',
        color: { type: 'single', color: '#000000' },
      },
      cornerDotsStyle: {
        type: 'square',
        color: { type: 'single', color: '#000000' },
      },
      background: {
        color: { type: 'single', color: '#ffffff' },
        transparent: false,
      },
    },
  },
  {
    id: 'corporate',
    name: 'Corporate',
    preview: '🔷',
    config: {
      dotsStyle: {
        type: 'square',
        color: { type: 'single', color: '#1a2b4a' },
      },
      cornerSquaresStyle: {
        type: 'square',
        color: { type: 'single', color: '#1a2b4a' },
      },
      cornerDotsStyle: {
        type: 'square',
        color: { type: 'single', color: '#1a2b4a' },
      },
      background: {
        color: { type: 'single', color: '#ffffff' },
        transparent: false,
      },
    },
  },
  {
    id: 'gradient-pop',
    name: 'Gradient Pop',
    preview: '🌈',
    config: {
      dotsStyle: {
        type: 'dots',
        color: {
          type: 'linearGradient',
          colors: ['#7C3AED', '#06B6D4'],
          rotation: 45,
        },
      },
      cornerSquaresStyle: {
        type: 'extra-rounded',
        color: { type: 'single', color: '#7C3AED' },
      },
      cornerDotsStyle: {
        type: 'dot',
        color: { type: 'single', color: '#06B6D4' },
      },
      background: {
        color: { type: 'single', color: '#ffffff' },
        transparent: false,
      },
    },
  },
  {
    id: 'neon',
    name: 'Neon',
    preview: '💚',
    config: {
      dotsStyle: {
        type: 'dots',
        color: { type: 'single', color: '#00FF88' },
      },
      cornerSquaresStyle: {
        type: 'extra-rounded',
        color: { type: 'single', color: '#00FF88' },
      },
      cornerDotsStyle: {
        type: 'dot',
        color: { type: 'single', color: '#00FF88' },
      },
      background: {
        color: { type: 'single', color: '#0a0a0a' },
        transparent: false,
      },
    },
  },
  {
    id: 'organic',
    name: 'Organic',
    preview: '🍂',
    config: {
      dotsStyle: {
        type: 'extra-rounded',
        color: { type: 'single', color: '#5C4033' },
      },
      cornerSquaresStyle: {
        type: 'extra-rounded',
        color: { type: 'single', color: '#5C4033' },
      },
      cornerDotsStyle: {
        type: 'dot',
        color: { type: 'single', color: '#8D6E63' },
      },
      background: {
        color: { type: 'single', color: '#FFF8E1' },
        transparent: false,
      },
    },
  },
  {
    id: 'violet',
    name: 'Violet',
    preview: '💜',
    config: {
      dotsStyle: {
        type: 'classy-rounded',
        color: {
          type: 'linearGradient',
          colors: ['#7C3AED', '#C4B5FD'],
          rotation: 135,
        },
      },
      cornerSquaresStyle: {
        type: 'classy',
        color: { type: 'single', color: '#7C3AED' },
      },
      cornerDotsStyle: {
        type: 'dot',
        color: { type: 'single', color: '#C4B5FD' },
      },
      background: {
        color: { type: 'single', color: '#ffffff' },
        transparent: false,
      },
    },
  },
  {
    id: 'retro',
    name: 'Retro',
    preview: '🟠',
    config: {
      dotsStyle: {
        type: 'classy',
        color: { type: 'single', color: '#B5451B' },
      },
      cornerSquaresStyle: {
        type: 'classy',
        color: { type: 'single', color: '#B5451B' },
      },
      cornerDotsStyle: {
        type: 'square',
        color: { type: 'single', color: '#E8A87C' },
      },
      background: {
        color: { type: 'single', color: '#FFF3E0' },
        transparent: false,
      },
    },
  },
];
