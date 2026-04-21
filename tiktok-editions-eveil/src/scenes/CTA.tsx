import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Background } from '../components/Background';
import { COLORS, FONTS } from '../theme';

const WORDS = [
  { text: 'LIS.', from: 0 },
  { text: 'APPLIQUE.', from: 15 },
  { text: 'CHANGE.', from: 30 },
];

export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = 1 + Math.sin(frame / 4) * 0.03;
  const fadeOut = interpolate(frame, [75, 90], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <Background intensity={1.2} />
      <AbsoluteFill
        style={{
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 30,
          opacity: fadeOut,
        }}
      >
        {WORDS.map((w) => {
          const s = spring({ frame: frame - w.from, fps, config: { damping: 140 } });
          const opacity = interpolate(frame - w.from, [0, 8], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div
              key={w.text}
              style={{
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 160,
                color: COLORS.ink,
                letterSpacing: 8,
                transform: `scale(${s * pulse})`,
                opacity,
                textShadow: `0 0 60px rgba(232,201,138,0.5)`,
                lineHeight: 1,
              }}
            >
              {w.text}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
