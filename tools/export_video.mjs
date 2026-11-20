// Renders the two page animations to MP4, frame by frame.
//   cd tools && npm install && node export_video.mjs
// Needs Google Chrome and ffmpeg. Set CHROME=/path/to/chrome to use another browser.
import puppeteer from 'puppeteer-core';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'static', 'video');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FPS = 30;
const TARGETS = [
  { el: '#player', api: 'UNIFIED_ANIM', name: 'unified_passes' },
  { el: '#duo', api: 'UNIFIED_ROUTE', name: 'unified_layouts' }
];

mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000, deviceScaleFactor: 2 });
  // reduced motion: no scroll reveals, and both animations wait at a fixed frame
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(pathToFileURL(join(ROOT, 'index.html')).href + '?t=0', { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: '.nav{display:none!important} .vbtn{visibility:hidden} .dl{display:none}' });

  for (const t of TARGETS) {
    const el = await page.$(t.el);
    if (!el) { console.log(`${t.name}: ${t.el} is not on the page, skipped`); continue; }
    const duration = await page.evaluate(api => window[api].duration, t.api);
    const frames = Math.round(duration * FPS);
    const dir = mkdtempSync(join(tmpdir(), `${t.name}-`));
    for (let f = 0; f < frames; f++) {
      await page.evaluate((api, time) => window[api].render(time), t.api, f / FPS);
      await el.screenshot({ path: join(dir, `f_${String(f).padStart(4, '0')}.png`) });
    }
    const out = join(OUT, `${t.name}.mp4`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, 'f_%04d.png'),
      '-vf', 'scale=1920:-2:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
      '-movflags', '+faststart', out]);
    rmSync(dir, { recursive: true, force: true });
    console.log(`${t.name}.mp4  ${frames} frames, ${duration.toFixed(1)} s`);
  }
} finally {
  await browser.close();
}
