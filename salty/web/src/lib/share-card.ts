import type { VerdictId } from "./pay/verdict";

/** What goes on a share image. Pay is deliberately absent: people share their rank, not their salary. */
export type ShareCardContent = {
  /** The big figure, e.g. "34%" or "Top 10%". */
  figure: string;
  /** Sentence under the figure, e.g. "of people in my job are paid more than me." */
  sentence: string;
  jobTitle: string;
  countryLabel: string;
  verdictId: VerdictId;
  verdictLabel: string;
  shakers: number;
  /** Bare host shown at the bottom, e.g. "salty.app". */
  host: string;
};

const WIDTH = 1080;
const HEIGHT = 1350;

const TONES: Record<VerdictId, { chip: string; chipText: string }> = {
  "extra-salty": { chip: "#ff4d2e", chipText: "#0f0f12" },
  salty: { chip: "#ffad1f", chipText: "#0f0f12" },
  fair: { chip: "#ffffff", chipText: "#0f0f12" },
  seasoned: { chip: "#2b36ff", chipText: "#ffffff" },
  "top-shelf": { chip: "#d9f24b", chipText: "#0f0f12" },
};

function fontFamily(variable: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value ? `${value}, ${fallback}` : fallback;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
  kept[maxLines - 1] = `${last.trimEnd()}…`;
  return kept;
}

function grain(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, turn: number, colour: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((turn * Math.PI) / 180);
  ctx.fillStyle = colour;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.restore();
}

function shaker(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, colour: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.strokeStyle = colour;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(7, 9);
  ctx.lineTo(17, 9);
  ctx.lineTo(19.2, 26.2);
  ctx.quadraticCurveTo(19.4, 29.5, 16.2, 29.5);
  ctx.lineTo(7.8, 29.5);
  ctx.quadraticCurveTo(4.6, 29.5, 4.8, 26.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(12, 9, 5.5, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(9, 17.5);
  ctx.lineTo(15, 17.5);
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();
}

/** Draws the 4:5 share image (the shape that fills the most screen on Instagram and TikTok photo posts). */
export async function drawShareCard(canvas: HTMLCanvasElement, content: ShareCardContent): Promise<void> {
  const display = fontFamily("--font-bricolage", "system-ui, sans-serif");
  const mono = fontFamily("--font-geist-mono", "ui-monospace, monospace");
  const sans = fontFamily("--font-geist", "system-ui, sans-serif");
  // Make sure the brand fonts are ready, otherwise the first draw falls back to a system face.
  await Promise.all([
    document.fonts.load(`800 100px ${display}`),
    document.fonts.load(`500 30px ${mono}`),
    document.fonts.load(`500 40px ${sans}`),
  ]).catch(() => undefined);

  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const tone = TONES[content.verdictId];
  const ink = "#0f0f12";
  const pad = 84;

  ctx.fillStyle = "#f4f1ea";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // A sprinkle of grains falling from the top right.
  const grains: [number, number, number, number][] = [
    [820, 150, 22, 18], [930, 232, 14, -30], [760, 262, 12, 44], [985, 176, 18, 12],
    [880, 96, 10, -18], [700, 190, 9, 60], [960, 110, 12, -44], [640, 110, 14, 26],
  ];
  for (const [x, y, size, turn] of grains) grain(ctx, x, y, size, turn, ink);

  // Wordmark.
  ctx.fillStyle = ink;
  ctx.textBaseline = "alphabetic";
  ctx.font = `800 semi-condensed 84px ${display}`;
  ctx.letterSpacing = "-1px";
  ctx.fillText("salty", pad, 170);
  grain(ctx, pad + ctx.measureText("salty").width + 16, 158, 19, 18, "#2b36ff");

  // Eyebrow.
  ctx.letterSpacing = "4px";
  ctx.font = `500 28px ${mono}`;
  ctx.fillStyle = "#4b4a52";
  ctx.fillText(`MY PAY CHECK · ${content.countryLabel.toUpperCase()}`, pad, 330);

  // The figure, shrunk to fit if it is words rather than a number.
  ctx.fillStyle = ink;
  let size = 400;
  do {
    ctx.font = `800 condensed ${size}px ${display}`;
    ctx.letterSpacing = `${-size * 0.012}px`;
    size -= 10;
  } while (ctx.measureText(content.figure).width > WIDTH - pad * 2 && size > 120);
  const figureBase = 330 + 60 + size * 0.86;
  ctx.fillText(content.figure, pad - size * 0.02, figureBase);

  // Sentence and job.
  ctx.letterSpacing = "-0.5px";
  ctx.font = `800 semi-condensed 68px ${display}`;
  let y = figureBase + 104;
  for (const line of wrap(ctx, content.sentence, WIDTH - pad * 2, 3)) {
    ctx.fillText(line, pad, y);
    y += 74;
  }
  ctx.letterSpacing = "0px";
  ctx.font = `500 38px ${sans}`;
  ctx.fillStyle = "#4b4a52";
  y += 8;
  for (const line of wrap(ctx, content.jobTitle, WIDTH - pad * 2, 2)) {
    ctx.fillText(line, pad, y);
    y += 50;
  }

  // Verdict chip with a hard shadow, sitting above the footer.
  ctx.font = `800 semi-condensed 56px ${display}`;
  ctx.letterSpacing = "-1px";
  const label = content.verdictLabel.toUpperCase();
  const shakerWidth = content.shakers * 50;
  const chipWidth = ctx.measureText(label).width + 72 + (shakerWidth ? shakerWidth + 18 : 0);
  const chipHeight = 104;
  const chipY = HEIGHT - 300;
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.roundRect(pad + 10, chipY + 10, chipWidth, chipHeight, 26);
  ctx.fill();
  ctx.fillStyle = tone.chip;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(pad, chipY, chipWidth, chipHeight, 26);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = tone.chipText;
  ctx.fillText(label, pad + 36, chipY + 72);
  let shakerX = pad + 36 + ctx.measureText(label).width + 22;
  for (let i = 0; i < content.shakers; i++) {
    shaker(ctx, shakerX, chipY + 16, 2.3, tone.chipText);
    shakerX += 50;
  }

  // Footer: the call to action that makes the image an advert.
  ctx.fillStyle = ink;
  ctx.fillRect(0, HEIGHT - 132, WIDTH, 132);
  ctx.fillStyle = "#f4f1ea";
  ctx.letterSpacing = "-1px";
  ctx.font = `800 semi-condensed 50px ${display}`;
  ctx.fillText("Are you underpaid?", pad, HEIGHT - 50);
  ctx.font = `500 34px ${mono}`;
  ctx.letterSpacing = "0px";
  ctx.fillStyle = "#d9f24b";
  const hostWidth = ctx.measureText(content.host).width;
  ctx.fillText(content.host, WIDTH - pad - hostWidth, HEIGHT - 52);
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
