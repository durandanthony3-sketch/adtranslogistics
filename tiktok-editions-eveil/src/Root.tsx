import { Composition } from 'remotion';
import { Video, VIDEO_DURATION } from './Video';
import { FPS, HEIGHT, WIDTH } from './theme';

export const Root: React.FC = () => {
  return (
    <Composition
      id="Main"
      component={Video}
      durationInFrames={VIDEO_DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
