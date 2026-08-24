import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Background } from '../components/Background';
import { COLORS, FONTS } from '../theme';

export const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 12, 70, 85], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  });
  const letterSpacing = interpolate(frame, [0, 40], [60, 22]);
  const lineWidth = spring({ frame: frame - 6, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill>
      <Background intensity={0.8} />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          opacity,
          flexDirection: 'column',
          gap: 36,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 26,
            letterSpacing: 18,
            color: COLORS.goldBright,
            textTransform: 'uppercase',
          }}
        >
          — collection —
        </div>
        <div
          style={{
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 150,
            color: COLORS.ink,
            letterSpacing: `${letterSpacing}px`,
            textShadow: `0 0 40px rgba(201,169,110,0.5)`,
            lineHeight: 1,
          }}
        >
          ÉDITIONS
        </div>
        <div
          style={{
            height: 2,
            width: 520 * lineWidth,
            background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
          }}
        />
        <div
          style={{
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 200,
            color: COLORS.goldBright,
            letterSpacing: `${letterSpacing}px`,
            textShadow: `0 0 60px rgba(232,201,138,0.6)`,
            lineHeight: 1,
          }}
        >
          ÉVEIL
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
