import { AbsoluteFill, interpolate, Series, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Background } from '../components/Background';
import { COLORS, FONTS, seconds } from '../theme';

type Book = {
  sigil: string;
  title: string;
  subtitle: string;
  accent: string;
};

const BOOKS: Book[] = [
  { sigil: '🜁', title: 'Detox Dopamine', subtitle: 'reprends ton attention.', accent: COLORS.goldBright },
  { sigil: '🜂', title: 'Shadow Work', subtitle: 'affronte ce que tu fuis.', accent: COLORS.ember },
  { sigil: '🜃', title: 'Hacker son Cerveau', subtitle: 'réécris ton code mental.', accent: COLORS.goldBright },
  { sigil: '🜄', title: "L'Art de l'Influence", subtitle: 'parle pour être suivi.', accent: COLORS.gold },
  { sigil: '⚡', title: 'Le Protocole du 1%', subtitle: "deviens l'exception.", accent: COLORS.goldBright },
  { sigil: '🔥', title: 'Glow Up Radical', subtitle: 'transforme ton enveloppe.', accent: COLORS.ember },
  { sigil: '🜔', title: 'Psychologie Noire', subtitle: 'vois ceux qui manipulent.', accent: COLORS.gold },
];

const CARD_DURATION = seconds(1.4);

export const BookShowcase: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background intensity={0.85} />
      <Series>
        {BOOKS.map((b, i) => (
          <Series.Sequence key={b.title} durationInFrames={CARD_DURATION}>
            <BookCard book={b} index={i} total={BOOKS.length} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};

const BookCard: React.FC<{ book: Book; index: number; total: number }> = ({
  book,
  index,
  total,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const exit = interpolate(frame, [CARD_DURATION - 8, CARD_DURATION], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(enter, exit);
  const y = interpolate(enter, [0, 1], [60, 0]);
  const sigilScale = spring({ frame: frame - 3, fps, config: { damping: 180 } });

  return (
    <AbsoluteFill
      style={{
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 80px',
        gap: 30,
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.mono,
          color: COLORS.inkMuted,
          letterSpacing: 12,
          fontSize: 22,
        }}
      >
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>

      <div
        style={{
          fontSize: 320,
          lineHeight: 1,
          color: book.accent,
          transform: `scale(${sigilScale})`,
          textShadow: `0 0 70px ${book.accent}`,
          fontFamily: FONTS.display,
        }}
      >
        {book.sigil}
      </div>

      <div
        style={{
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: 86,
          color: COLORS.ink,
          textAlign: 'center',
          letterSpacing: 2,
          lineHeight: 1.05,
          marginTop: 10,
        }}
      >
        {book.title}
      </div>

      <div
        style={{
          height: 1,
          width: 260,
          background: `linear-gradient(90deg, transparent, ${book.accent}, transparent)`,
        }}
      />

      <div
        style={{
          fontFamily: FONTS.body,
          fontWeight: 400,
          fontSize: 44,
          color: COLORS.inkMuted,
          textAlign: 'center',
          letterSpacing: 1,
          fontStyle: 'italic',
        }}
      >
        {book.subtitle}
      </div>
    </AbsoluteFill>
  );
};

export const BOOK_SHOWCASE_DURATION = CARD_DURATION * BOOKS.length;
