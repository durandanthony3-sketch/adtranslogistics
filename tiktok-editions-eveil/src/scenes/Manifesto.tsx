import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { COLORS, FONTS } from '../theme';

const KEYWORDS = [
  'MAÎTRISE MENTALE',
  'PSYCHOLOGIE NOIRE',
  'DISCIPLINE RADICALE',
  "TRAVAIL DE L'OMBRE",
  'RÉINGÉNIERIE DU CERVEAU',
];

const INTRO_TEXT = 'Nous publions les savoirs';
const INTRO_TEXT_2 = 'que le système préfère';
const INTRO_TEXT_3 = 'garder sous silence.';

export const Manifesto: React.FC = () => {
  const frame = useCurrentFrame();
  const total = 120;
  const perKeyword = 14;

  return (
    <AbsoluteFill>
      <Background intensity={0.6} />
      <AbsoluteFill
        style={{
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0 80px',
          gap: 32,
        }}
      >
        <IntroLine text={INTRO_TEXT} from={0} />
        <IntroLine text={INTRO_TEXT_2} from={10} />
        <IntroLine text={INTRO_TEXT_3} from={20} accent />
        <div style={{ height: 40 }} />
        <div
          style={{
            height: 1,
            width: interpolate(frame, [30, 55], [0, 420], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
          }}
        />
        <div style={{ height: 20 }} />
        {KEYWORDS.map((word, i) => {
          const start = 50 + i * perKeyword;
          return (
            <Sequence key={word} from={start} durationInFrames={total - start + 30}>
              <Keyword text={word} />
            </Sequence>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const IntroLine: React.FC<{ text: string; from: number; accent?: boolean }> = ({
  text,
  from,
  accent,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [from, from + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(frame, [from, from + 14], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        fontFamily: FONTS.body,
        fontWeight: accent ? 800 : 400,
        fontSize: accent ? 64 : 54,
        color: accent ? COLORS.goldBright : COLORS.ink,
        textAlign: 'center',
        opacity,
        transform: `translateY(${y}px)`,
        letterSpacing: accent ? 2 : 0,
      }}
    >
      {text}
    </div>
  );
};

const Keyword: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 6, 14], [0, 1, 1], {
    extrapolateRight: 'clamp',
  });
  const x = interpolate(frame, [0, 10], [-30, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
        transform: `translateX(${x}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: 82,
          color: COLORS.ink,
          letterSpacing: 6,
          textAlign: 'center',
          textShadow: `0 0 40px rgba(232,201,138,0.4)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};
