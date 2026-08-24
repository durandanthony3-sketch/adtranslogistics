import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Background } from '../components/Background';
import { Sigil } from '../components/Sigil';
import { COLORS, FONTS } from '../theme';

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sigilScale = spring({ frame, fps, config: { damping: 200, mass: 1 } });
  const sigilOpacity = interpolate(frame, [0, 10, 45, 60], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  });
  const hairline = interpolate(frame, [10, 40], [0, 100], { extrapolateRight: 'clamp' });
  const flash = interpolate(frame, [55, 60], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <Background intensity={0.6} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            opacity: sigilOpacity,
            transform: `scale(${sigilScale})`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 40,
          }}
        >
          <Sigil size={520} opacity={0.85} />
          <div
            style={{
              height: 1,
              width: `${hairline}%`,
              maxWidth: 520,
              background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
            }}
          />
          <div
            style={{
              fontFamily: FONTS.mono,
              letterSpacing: 14,
              fontSize: 22,
              color: COLORS.inkMuted,
              textTransform: 'uppercase',
            }}
          >
            · ouvre les yeux ·
          </div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.ink,
          opacity: flash * 0.9,
          mixBlendMode: 'screen',
        }}
      />
    </AbsoluteFill>
  );
};
