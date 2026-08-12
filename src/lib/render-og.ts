import { PRESETS, type OGState } from "./og-types";

const imageCache = new Map<string, HTMLImageElement>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    const joined = lines.join(" ");
    if (joined.length < text.length) {
      while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) {
        last = last.slice(0, -1);
      }
      lines[maxLines - 1] = `${last.trimEnd()}…`;
    }
  }
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

export async function renderOG(
  canvas: HTMLCanvasElement,
  state: OGState,
): Promise<void> {
  const { w, h } = PRESETS[state.preset];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, w, h);

  // Background gradient
  const rad = (state.bgAngle * Math.PI) / 180;
  const cx = w / 2;
  const cy = h / 2;
  const len = Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad));
  const grad = ctx.createLinearGradient(
    cx - (Math.cos(rad) * len) / 2,
    cy - (Math.sin(rad) * len) / 2,
    cx + (Math.cos(rad) * len) / 2,
    cy + (Math.sin(rad) * len) / 2,
  );
  grad.addColorStop(0, state.bgFrom);
  grad.addColorStop(1, state.bgTo);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const pad = state.padding;
  let textWidth = w - pad * 2;
  let sideImage: HTMLImageElement | null = null;

  if (state.imageUrl && state.imageMode !== "none") {
    try {
      const img = await loadImage(state.imageUrl);
      if (state.imageMode === "cover") {
        drawCover(ctx, img, 0, 0, w, h);
        ctx.fillStyle = `rgba(0,0,0,${state.overlay})`;
        ctx.fillRect(0, 0, w, h);
        const g2 = ctx.createLinearGradient(0, 0, w, 0);
        g2.addColorStop(0, "rgba(0,0,0,0.55)");
        g2.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, w, h);
      } else {
        sideImage = img;
      }
    } catch {
      /* ignore broken image */
    }
  }

  if (sideImage) {
    const iw = Math.round(w * 0.4);
    const ix = w - iw - pad / 2;
    const iy = pad / 2;
    const ih = h - pad;
    ctx.save();
    roundRect(ctx, ix, iy, iw, ih, 28);
    ctx.clip();
    drawCover(ctx, sideImage, ix, iy, iw, ih);
    ctx.restore();
    textWidth = ix - pad - 40;
  }

  if (state.showGrain) {
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = state.textColor;
    for (let i = 0; i < 1400; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
    }
    ctx.restore();
  }

  const centered = state.align === "center" && !sideImage;
  const originX = centered ? w / 2 : pad;
  ctx.textAlign = centered ? "center" : "left";
  ctx.textBaseline = "alphabetic";

  // Accent bar
  if (state.showAccentBar && !centered) {
    ctx.fillStyle = state.accent;
    roundRect(ctx, pad, pad, 76, 8, 4);
    ctx.fill();
  }

  let y = pad + (state.showAccentBar && !centered ? 76 : 24);

  // Badge row
  if (state.badge.trim()) {
    ctx.font = `600 ${Math.round(state.descSize * 0.72)}px ${state.font}, sans-serif`;
    ctx.fillStyle = state.accent;
    ctx.fillText(state.badge.toUpperCase(), originX, y + state.descSize * 0.6);
    y += state.descSize * 1.5;
  }

  // Title
  ctx.font = `700 ${state.titleSize}px ${state.font}, sans-serif`;
  ctx.fillStyle = state.textColor;
  const titleLines = wrap(ctx, state.title, textWidth, 3);
  const titleLh = state.titleSize * 1.14;
  y += titleLh * 0.8;
  for (const line of titleLines) {
    ctx.fillText(line, originX, y);
    y += titleLh;
  }

  // Description
  if (state.description.trim()) {
    ctx.font = `400 ${state.descSize}px ${state.font}, sans-serif`;
    ctx.globalAlpha = 0.82;
    const descLines = wrap(ctx, state.description, textWidth, 3);
    const descLh = state.descSize * 1.4;
    y += descLh * 0.35;
    for (const line of descLines) {
      ctx.fillText(line, originX, y);
      y += descLh;
    }
    ctx.globalAlpha = 1;
  }

  // Footer: logo + domain
  const footerY = h - pad;
  let fx = originX;
  const logoSize = 46;
  if (state.logoUrl) {
    try {
      const logo = await loadImage(state.logoUrl);
      const lx = centered
        ? w / 2 - (logoSize + 14 + ctx.measureText(state.domain).width) / 2
        : pad;
      ctx.save();
      roundRect(ctx, lx, footerY - logoSize + 4, logoSize, logoSize, 12);
      ctx.clip();
      drawCover(ctx, logo, lx, footerY - logoSize + 4, logoSize, logoSize);
      ctx.restore();
      fx = lx + logoSize + 16;
      ctx.textAlign = "left";
    } catch {
      /* ignore */
    }
  }
  if (state.domain.trim()) {
    ctx.font = `500 ${Math.round(state.descSize * 0.78)}px ${state.font}, sans-serif`;
    ctx.fillStyle = state.textColor;
    ctx.globalAlpha = 0.7;
    ctx.fillText(state.domain, fx, footerY);
    ctx.globalAlpha = 1;
  }
}

export function download(canvas: HTMLCanvasElement, format: "png" | "jpeg" | "webp") {
  const mime = `image/${format}`;
  const url = canvas.toDataURL(mime, 0.92);
  const a = document.createElement("a");
  a.href = url;
  a.download = `og-image.${format === "jpeg" ? "jpg" : format}`;
  a.click();
}