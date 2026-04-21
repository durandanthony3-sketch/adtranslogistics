import { continueRender, delayRender, staticFile } from 'remotion';

const FONT_FACES: Array<{ family: string; weight: string; file: string }> = [
  { family: 'Cinzel', weight: '700', file: 'cinzel-700.woff2' },
  { family: 'Cinzel', weight: '900', file: 'cinzel-900.woff2' },
  { family: 'Inter', weight: '400', file: 'inter-400.woff2' },
  { family: 'Inter', weight: '700', file: 'inter-700.woff2' },
  { family: 'Inter', weight: '900', file: 'inter-900.woff2' },
];

if (typeof document !== 'undefined') {
  const css = FONT_FACES.map(
    ({ family, weight, file }) => `
      @font-face {
        font-family: '${family}';
        font-weight: ${weight};
        font-style: normal;
        font-display: block;
        src: url('${staticFile(`fonts/${file}`)}') format('woff2');
      }
    `,
  ).join('\n');

  const style = document.createElement('style');
  style.setAttribute('data-editions-eveil-fonts', 'true');
  style.textContent = css;
  document.head.appendChild(style);

  const handle = delayRender('Waiting for fonts', { timeoutInMilliseconds: 60000 });
  Promise.all(
    FONT_FACES.map(({ family, weight, file }) => {
      const ff = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format('woff2')`, {
        weight,
        style: 'normal',
      });
      return ff.load().then((loaded) => {
        document.fonts.add(loaded);
      });
    }),
  )
    .then(() => document.fonts.ready)
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error('Font load error', err);
      continueRender(handle);
    });
}
