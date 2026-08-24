import { interpolate, useCurrentFrame } from 'remotion';
import { COLORS } from '../theme';

export const Sigil: React.FC<{ size?: number; opacity?: number }> = ({
  size = 260,
  opacity = 0.6,
}) => {
  const frame = useCurrentFrame();
  const rot = interpolate(frame, [0, 300], [0, 60]);
  const pulse = 1 + Math.sin(frame / 10) * 0.02;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{
        opacity,
        transform: `rotate(${rot}deg) scale(${pulse})`,
      }}
    >
      <defs>
        <radialGradient id="iris" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={COLORS.goldBright} stopOpacity="1" />
          <stop offset="60%" stopColor={COLORS.gold} stopOpacity="0.7" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill="none" stroke={COLORS.gold} strokeWidth="0.8" opacity="0.7" />
      <circle cx="100" cy="100" r="72" fill="none" stroke={COLORS.gold} strokeWidth="0.5" opacity="0.5" />
      <g stroke={COLORS.gold} strokeWidth="0.6" opacity="0.7">
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const x1 = 100 + Math.cos(a) * 72;
          const y1 = 100 + Math.sin(a) * 72;
          const x2 = 100 + Math.cos(a) * 92;
          const y2 = 100 + Math.sin(a) * 92;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
      <polygon
        points="100,40 160,140 40,140"
        fill="none"
        stroke={COLORS.gold}
        strokeWidth="1.2"
        opacity="0.85"
      />
      <circle cx="100" cy="108" r="18" fill="url(#iris)" />
      <circle cx="100" cy="108" r="6" fill={COLORS.bgDeep} />
    </svg>
  );
};
