// Genera una tarjeta cuadrada (1080×1080, formato Instagram/Stories) para
// compartir el pasaporte o el resumen anual como IMAGEN — sin depender de
// ninguna librería de captura de pantalla (dibujado a mano con Canvas 2D,
// mucho más ligero que "hacer una foto" del DOM).
const SIZE = 1080;

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * @param {{ emoji: string, title: string, subtitle: string, stats: {label:string, value:string}[], accent?: string }} opts
 * @returns {Promise<Blob>} PNG
 */
export async function generateShareCard({ emoji, title, subtitle, stats = [], accent = '#eab308' }) {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  // Fondo: degradado oscuro con un halo de color de acento (mismo lenguaje visual que el globo)
  const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  bg.addColorStop(0, '#0f1117');
  bg.addColorStop(1, '#1a1d28');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const halo = ctx.createRadialGradient(SIZE / 2, SIZE * 0.38, 40, SIZE / 2, SIZE * 0.38, SIZE * 0.6);
  halo.addColorStop(0, `${accent}33`);
  halo.addColorStop(1, 'transparent');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Emoji grande centrado
  ctx.textAlign = 'center';
  ctx.font = '220px system-ui, -apple-system, sans-serif';
  ctx.fillText(emoji || '🦆', SIZE / 2, SIZE * 0.42);

  // Título
  ctx.fillStyle = '#f4f3f0';
  ctx.font = '700 68px system-ui, -apple-system, sans-serif';
  ctx.fillText(title, SIZE / 2, SIZE * 0.53);

  // Subtítulo
  ctx.fillStyle = '#9a9da8';
  ctx.font = '400 34px system-ui, -apple-system, sans-serif';
  ctx.fillText(subtitle, SIZE / 2, SIZE * 0.585);

  // Fila de estadísticas (hasta 3), como tarjetas
  if (stats.length > 0) {
    const cardW = 280, cardH = 160, gap = 24;
    const totalW = stats.length * cardW + (stats.length - 1) * gap;
    let x = (SIZE - totalW) / 2;
    const y = SIZE * 0.66;
    stats.slice(0, 3).forEach((s) => {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      roundedRect(ctx, x, y, cardW, cardH, 24);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 2;
      roundedRect(ctx, x, y, cardW, cardH, 24);
      ctx.stroke();

      ctx.fillStyle = accent;
      ctx.font = '700 56px system-ui, -apple-system, sans-serif';
      ctx.fillText(s.value, x + cardW / 2, y + 78);

      ctx.fillStyle = '#9a9da8';
      ctx.font = '400 24px system-ui, -apple-system, sans-serif';
      ctx.fillText(s.label, x + cardW / 2, y + 118);

      x += cardW + gap;
    });
  }

  // Pie con el nombre de la app
  ctx.fillStyle = '#f4f3f0';
  ctx.font = '700 32px system-ui, -apple-system, sans-serif';
  ctx.fillText('🦆 Waddle', SIZE / 2, SIZE * 0.94);
  ctx.fillStyle = '#6b6e78';
  ctx.font = '400 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('waddle app · planifica tu próximo viaje', SIZE / 2, SIZE * 0.965);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
}

/**
 * Comparte el blob con el share sheet nativo (móvil) o, si no está disponible,
 * lo descarga directamente (escritorio / navegadores sin Web Share).
 */
export async function shareOrDownload(blob, filename, { title, text } = {}) {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text });
      return 'shared';
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled'; // el usuario cerró el share sheet, no es un error
      // si falla el share nativo por otro motivo, caemos a la descarga
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
