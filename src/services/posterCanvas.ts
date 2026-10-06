import { SliceTicket } from '../types';

/**
 * Loads an image with a strict timeout to prevent any mobile network hanging.
 */
const loadImage = (src: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
    setTimeout(() => resolve(null), 800);
  });
};

/**
 * Helper to draw rounded rectangle on Canvas 2D
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Pure HTML5 Canvas 2D engine to generate the Monthly Life Slices Wall Poster.
 * 100% deterministic, zero network font timeouts, zero SVG foreignObject crashes.
 */
export async function generateMonthlyPoster(
  tickets: SliceTicket[],
  streakDays: number,
  monthLabel: string = '2026年10月',
  totalSlices: number = 0
): Promise<string> {
  const width = 720;
  const height = 1260;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // 1. Warm Paper Base Background
  ctx.fillStyle = '#F7F5F0';
  ctx.fillRect(0, 0, width, height);

  // Outer subtle double border
  ctx.strokeStyle = '#E0D9CD';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(20, 20, width - 40, height - 40);
  ctx.strokeStyle = '#EFE9DE';
  ctx.lineWidth = 1;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  // 2. Poster Header
  // Top Kicker
  ctx.fillStyle = '#8C8578';
  ctx.font = 'bold 13px "Space Mono", monospace, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MONTHLY LIFE SLICES WALL · 2026 ARCHIVE', width / 2, 65);

  // Main Headline
  ctx.fillStyle = '#2A2825';
  ctx.font = 'bold 30px "Noto Serif SC", Georgia, "Songti SC", serif';
  ctx.fillText(`${monthLabel} · 日常微光拼贴`, width / 2, 105);

  // Subtitle Poetic Quote
  ctx.fillStyle = '#6E685E';
  ctx.font = 'italic 15px "Noto Serif SC", Georgia, "Songti SC", serif';
  ctx.fillText('“认真生活的每一刻，都在悄悄沉淀成诗”', width / 2, 135);

  // Stats Capsule Badge
  const badgeW = 440;
  const badgeH = 34;
  const badgeX = (width - badgeW) / 2;
  const badgeY = 155;
  ctx.fillStyle = '#EFECE5';
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 10);
  ctx.fill();

  ctx.fillStyle = '#5A544A';
  ctx.font = '12px "Space Mono", monospace, sans-serif';
  ctx.fillText(
    `已铸造 ${tickets.length} 张票券  ·  连续 ${streakDays} 天  ·  达成 ${totalSlices} 项日常`,
    width / 2,
    badgeY + 22
  );

  // Dashed divider line
  ctx.strokeStyle = '#D8D2C5';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(40, 215);
  ctx.lineTo(width - 40, 215);
  ctx.stroke();
  ctx.setLineDash([]); // reset

  // 3. Grid of 4 Featured Tickets (2 columns x 2 rows)
  const featured = tickets.slice(0, 4);
  const cardW = 310;
  const cardH = 410;
  const startX = 40;
  const gapX = 20;
  const startY = 240;
  const gapY = 20;

  for (let i = 0; i < featured.length; i++) {
    const t = featured[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    // Card Paper Background & Shadow
    ctx.shadowColor = 'rgba(42, 40, 37, 0.06)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = t.template === 'ticket' ? '#F4F1EA' : '#FFFDF9';
    roundRect(ctx, x, y, cardW, cardH, 12);
    ctx.fill();
    ctx.shadowColor = 'transparent'; // reset

    // Card border
    ctx.strokeStyle = '#DFD9CD';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Card Header Bar
    ctx.fillStyle = '#8C8578';
    ctx.font = '11px "Space Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(t.dateDisplay, x + 16, y + 26);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#C86D51';
    ctx.font = 'bold 11px "Space Mono", monospace';
    ctx.fillText(t.ticketNo, x + cardW - 16, y + 26);

    // Subtle divider
    ctx.strokeStyle = '#EAE5DB';
    ctx.beginPath();
    ctx.moveTo(x + 16, y + 36);
    ctx.lineTo(x + cardW - 16, y + 36);
    ctx.stroke();

    // Render Specific Template Content
    if (t.imageData) {
      // If pristine captured image exists, load and draw it
      const img = await loadImage(t.imageData);
      if (img) {
        ctx.save();
        roundRect(ctx, x + 20, y + 48, cardW - 40, cardH - 100, 6);
        ctx.clip();
        ctx.drawImage(img, x + 20, y + 48, cardW - 40, cardH - 100);
        ctx.restore();
      } else {
        drawFallbackHabits(ctx, t, x, y, cardW, cardH);
      }
    } else if (t.template === 'polaroid') {
      // Vintage Polaroid Box
      const pImg = t.photoUrl ? await loadImage(t.photoUrl) : null;
      const photoH = 210;
      if (pImg) {
        ctx.save();
        roundRect(ctx, x + 20, y + 48, cardW - 40, photoH, 4);
        ctx.clip();
        ctx.drawImage(pImg, x + 20, y + 48, cardW - 40, photoH);
        ctx.restore();
      } else {
        // Aesthetic coffee/warm gradient
        ctx.fillStyle = '#EAE5DB';
        roundRect(ctx, x + 20, y + 48, cardW - 40, photoH, 4);
        ctx.fill();
        ctx.fillStyle = '#6E685E';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('☕', x + cardW / 2, y + 150);
      }

      // Poetic Quote
      ctx.fillStyle = '#3E3A33';
      ctx.font = 'italic 12px "Noto Serif SC", Georgia, serif';
      ctx.textAlign = 'center';
      const quoteShort = t.quote.length > 20 ? t.quote.slice(0, 18) + '...' : t.quote;
      ctx.fillText(`“${quoteShort}”`, x + cardW / 2, y + 285);

      // Habits line
      ctx.fillStyle = '#7C7569';
      ctx.font = '11px "Space Mono", monospace';
      ctx.fillText(`${t.city} · 已完成 ${t.completedCount} 项切片`, x + cardW / 2, y + 315);
    } else if (t.template === 'ticket') {
      // Cinema Ticket Layout
      ctx.fillStyle = '#2A2825';
      ctx.font = 'bold 12px "Space Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('LIFE CINEMA · 人生放映厅', x + 18, y + 60);

      ctx.fillStyle = '#2A2825';
      ctx.font = 'bold 15px "Noto Serif SC", Georgia, serif';
      ctx.fillText(t.movieTitle || '《认真生活的一天》', x + 18, y + 90);

      // Cast Habits
      ctx.fillStyle = '#555';
      ctx.font = '12px "Noto Serif SC", sans-serif';
      let hy = y + 125;
      for (const h of t.completedHabits.slice(0, 3)) {
        ctx.fillText(`${h.icon}  ${h.title}`, x + 18, hy);
        hy += 26;
      }

      // Cinema Info
      ctx.strokeStyle = '#D5CEC2';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x + 18, hy + 10);
      ctx.lineTo(x + cardW - 18, hy + 10);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#7C7569';
      ctx.font = '11px "Space Mono", monospace';
      ctx.fillText(`SEAT: ${t.seatNumber || 'VIP-01-A'}`, x + 18, hy + 35);
      ctx.textAlign = 'right';
      ctx.fillText('HALL 01 / 巨幕厅', x + cardW - 18, hy + 35);
    } else {
      // Convenience Store Receipt Layout
      ctx.fillStyle = '#2A2825';
      ctx.font = 'bold 13px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('生活便利店 · 今日清单', x + cardW / 2, y + 62);

      ctx.strokeStyle = '#D8D2C6';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x + 20, y + 78);
      ctx.lineTo(x + cardW - 20, y + 78);
      ctx.stroke();
      ctx.setLineDash([]);

      let hy = y + 108;
      ctx.textAlign = 'left';
      ctx.font = '12px "Space Mono", monospace';
      for (const h of t.completedHabits.slice(0, 4)) {
        ctx.fillStyle = '#2A2825';
        const title = h.title.length > 9 ? h.title.slice(0, 9) + '..' : h.title;
        ctx.fillText(`${h.icon} ${title}`, x + 20, hy);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#C86D51';
        ctx.fillText('100%', x + cardW - 20, hy);
        ctx.textAlign = 'left';
        hy += 28;
      }

      ctx.strokeStyle = '#D8D2C6';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x + 20, hy + 5);
      ctx.lineTo(x + cardW - 20, hy + 5);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#6E685E';
      ctx.font = '11px "Space Mono", monospace';
      ctx.fillText('实付意志力', x + 20, hy + 28);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#2A2825';
      ctx.font = 'bold 13px "Space Mono", monospace';
      ctx.fillText(`${t.willpowerPercent}%`, x + cardW - 20, hy + 28);
    }

    // Card Footer with Terracotta Seal
    ctx.strokeStyle = '#EAE5DB';
    ctx.beginPath();
    ctx.moveTo(x + 16, y + cardH - 38);
    ctx.lineTo(x + cardW - 16, y + cardH - 38);
    ctx.stroke();

    ctx.fillStyle = '#8C8578';
    ctx.font = '10px "Space Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${t.city} · ${t.weather}`, x + 16, y + cardH - 18);

    // Terracotta Seal
    ctx.strokeStyle = '#C86D51';
    ctx.lineWidth = 1.2;
    ctx.fillStyle = '#C86D51';
    roundRect(ctx, x + cardW - 74, y + cardH - 30, 58, 20, 4);
    ctx.stroke();
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MINTED', x + cardW - 45, y + cardH - 16);
  }

  // 4. Poster Footer with Barcode
  const footerY = 1130;
  ctx.strokeStyle = '#D8D2C5';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40, footerY);
  ctx.lineTo(width - 40, footerY);
  ctx.stroke();

  // Synthetic Barcode Lines
  const barcodeX = (width - 340) / 2;
  const barcodeY = footerY + 16;
  const barcodeH = 34;
  for (let b = 0; b < 64; b++) {
    const isThick = (b * 7 + 2) % 4 === 0;
    const isSkip = b % 7 === 0;
    if (!isSkip) {
      ctx.fillStyle = '#2A2825';
      ctx.fillRect(barcodeX + b * 5.2, barcodeY, isThick ? 3.5 : 1.5, barcodeH);
    }
  }

  // Barcode Label & Subtext
  ctx.fillStyle = '#8C8578';
  ctx.font = '10px "Space Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SLICE ARCHIVE · 202610-ALL-CLEAR', width / 2, footerY + 65);

  ctx.fillStyle = '#C86D51';
  ctx.font = 'bold 12px "Noto Serif SC", serif';
  ctx.fillText('★ 平凡日常 · 皆为诗篇 ★', width / 2, footerY + 86);

  return canvas.toDataURL('image/png', 0.98);
}

function drawFallbackHabits(
  ctx: CanvasRenderingContext2D,
  t: SliceTicket,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.fillStyle = '#2A2825';
  ctx.font = '13px "Space Mono", monospace';
  ctx.textAlign = 'left';
  let hy = y + 70;
  for (const habit of t.completedHabits.slice(0, 4)) {
    ctx.fillText(`${habit.icon} ${habit.title}`, x + 20, hy);
    hy += 26;
  }
}
