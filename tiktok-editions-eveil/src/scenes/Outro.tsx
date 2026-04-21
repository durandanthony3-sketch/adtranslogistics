import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Background } from '../components/Background';
import { Sigil } from '../components/Sigil';
import { COLORS, FONTS } from '../theme';

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sigil = spring({ frame, fps, config: { damping: 160 } });
  const textOpacity = interpolate(frame, [12, 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const handleOpacity = interpolate(frame, [30, 48], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [70, 85], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <Background intensity={0.8} />
      <AbsoluteFill
        style={{
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 50,
          opacity: fadeOut,
        }}
      >
        <div style={{ transform: `scale(${sigil})` }}>
          <Sigil size={440} opacity={0.95} />
        </div>
        <div
          style={{
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 90,
            color: COLORS.ink,
            letterSpacing: 4,
            textAlign: 'center',
            opacity: textOpacity,
            textShadow: `0 0 40px rgba(232,201,138,0.4)`,
          }}
        >
          LE RESTE SUIVRA.
        </div>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 32,
            letterSpacing: 10,
            color: COLORS.goldBright,
            opacity: handleOpacity,
            textTransform: 'uppercase',
          }}
        >
          @editions.eveil
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
