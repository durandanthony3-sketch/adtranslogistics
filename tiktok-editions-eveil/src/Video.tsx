import { AbsoluteFill, Series } from 'remotion';
import './fonts';
import { Intro } from './scenes/Intro';
import { Title } from './scenes/Title';
import { Tagline } from './scenes/Tagline';
import { Manifesto } from './scenes/Manifesto';
import { BookShowcase, BOOK_SHOWCASE_DURATION } from './scenes/BookShowcase';
import { CTA } from './scenes/CTA';
import { Outro } from './scenes/Outro';
import { COLORS, seconds } from './theme';

const INTRO_D = seconds(2);
const TITLE_D = seconds(3);
const TAGLINE_D = seconds(3.5);
const MANIFESTO_D = seconds(4);
const CTA_D = seconds(3);
const OUTRO_D = seconds(3);

export const VIDEO_DURATION =
  INTRO_D + TITLE_D + TAGLINE_D + MANIFESTO_D + BOOK_SHOWCASE_DURATION + CTA_D + OUTRO_D;

export const Video: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
      <Series>
        <Series.Sequence durationInFrames={INTRO_D}>
          <Intro />
        </Series.Sequence>
        <Series.Sequence durationInFrames={TITLE_D}>
          <Title />
        </Series.Sequence>
        <Series.Sequence durationInFrames={TAGLINE_D}>
          <Tagline />
        </Series.Sequence>
        <Series.Sequence durationInFrames={MANIFESTO_D}>
          <Manifesto />
        </Series.Sequence>
        <Series.Sequence durationInFrames={BOOK_SHOWCASE_DURATION}>
          <BookShowcase />
        </Series.Sequence>
        <Series.Sequence durationInFrames={CTA_D}>
          <CTA />
        </Series.Sequence>
        <Series.Sequence durationInFrames={OUTRO_D}>
          <Outro />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
