import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { COLORS } from '../theme';

export const Background: React.FC<{ intensity?: number }> = ({ intensity = 1 }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 40) * 40;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 45% at 50% ${40 + drift / 4}%, rgba(201,169,110,${0.18 * intensity}) 0%, rgba(201,169,110,0.04) 40%, rgba(0,0,0,0) 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(80% 60% at 50% 110%, rgba(226,88,34,${0.12 * intensity}) 0%, rgba(0,0,0,0) 60%)`,
          transform: `translateY(${drift}px)`,
        }}
      />
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      boxShadow: 'inset 0 0 320px 60px rgba(0,0,0,0.95)',
      pointerEvents: 'none',
    }}
  />
);

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = (frame * 9301 + 49297) % 233280;
  const offset = (seed / 233280) * 200;

  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'>
      <filter id='n'>
        <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='${frame % 16}'/>
        <feColorMatrix type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.35 0'/>
      </filter>
      <rect width='100%' height='100%' filter='url(#n)' opacity='0.35'/>
    </svg>`;
  const dataUrl = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;

  return (
    <AbsoluteFill
      style={{
        backgroundImage: dataUrl,
        backgroundSize: '400px 400px',
        backgroundPosition: `${offset}px ${-offset}px`,
        mixBlendMode: 'overlay',
        opacity: 0.4,
        pointerEvents: 'none',
      }}
    />
  );
};
