export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const seconds = (s: number) => Math.round(s * FPS);

export const COLORS = {
  bg: '#05050A',
  bgDeep: '#000000',
  ink: '#F5F0E6',
  inkMuted: 'rgba(245, 240, 230, 0.55)',
  gold: '#C9A96E',
  goldBright: '#E8C98A',
  ember: '#E25822',
  shadow: '#1B1A1F',
};

export const FONTS = {
  display: '"Cinzel", "Times New Roman", serif',
  body: '"Inter", "Helvetica Neue", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};
