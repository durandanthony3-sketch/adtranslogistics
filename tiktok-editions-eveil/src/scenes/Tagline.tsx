import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { COLORS, FONTS } from '../theme';

const LINES = [
  { text: 'Des livres', from: 0 },
  { text: 'pour ceux qui', from: 12 },
  { text: 'refusent de', from: 24 },
  { text: 'DORMIR DEBOUT.', from: 38, accent: true },
];

export const Tagline: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [85, 105], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <Background intensity={0.7} />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 18,
          opacity: fadeOut,
          padding: '0 80px',
        }}
      >
        {LINES.map((l, i) => {
          const appear = interpolate(frame, [l.from, l.from + 10], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const translate = interpolate(frame, [l.from, l.from + 14], [30, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div
              key={i}
              style={{
                fontFamily: FONTS.display,
                fontWeight: l.accent ? 900 : 500,
                fontSize: l.accent ? 120 : 82,
                color: l.accent ? COLORS.goldBright : COLORS.ink,
                textShadow: l.accent ? `0 0 50px rgba(232,201,138,0.55)` : 'none',
                letterSpacing: l.accent ? 4 : 2,
                textAlign: 'center',
                opacity: appear,
                transform: `translateY(${translate}px)`,
                lineHeight: 1.05,
              }}
            >
              {l.text}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
