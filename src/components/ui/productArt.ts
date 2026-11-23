/**
 * Palette-only product illustrations, ported from the prototype.
 * Used as an image fallback until real product photography is uploaded.
 * Output is generated entirely from code (whitelisted type + integer variant), never from user input.
 */
const R = "#FF4B33", I = "#F4F1EA", T = "#0F766E", G = "#DDAA72";

export const ART_TYPES = ["rice", "grain", "fish", "prawn", "shutki", "spice", "seed", "dal", "chola", "oil", "honey", "ghee", "gur", "doi", "citrus"] as const;
export type ArtType = (typeof ART_TYPES)[number];

export function parseArtKey(key: string | null | undefined): [ArtType, number] {
  const [t, v] = (key ?? "").split(":");
  const type = (ART_TYPES as readonly string[]).includes(t) ? (t as ArtType) : "grain";
  const variant = Math.max(0, Math.min(5, Number.parseInt(v ?? "0", 10) || 0));
  return [type, variant];
}

function grains(cx: number, cy: number, n: number, col: string, rx = 3.2, ry = 1.4, spread = 26) {
  let o = "";
  for (let i = 0; i < n; i++) {
    const ang = (i * 137.5) % 360;
    const r = Math.sqrt(i / n) * spread;
    const x = (cx + Math.cos((ang * Math.PI) / 180) * r).toFixed(1);
    const y = (cy + Math.sin((ang * Math.PI) / 180) * r * 0.45).toFixed(1);
    o += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${(i * 47) % 180} ${x} ${y})" fill="${col}"/>`;
  }
  return o;
}

export function artSvg(key: string | null | undefined): string {
  const [t, v] = parseArtKey(key);
  const bgc = [G, R, T][v % 3];
  const bg = `<rect width="120" height="120" fill="${I}"/><circle cx="84" cy="34" r="30" fill="${bgc}" opacity=".18"/><circle cx="34" cy="92" r="22" fill="${G}" opacity=".22"/>`;
  let s = "";
  switch (t) {
    case "rice":
      s = `<ellipse cx="60" cy="58" rx="36" ry="16" fill="${I}" stroke="${T}" stroke-width="1.2"/>${grains(60, 56, 46, [G, T, G][v % 3], 3, 1.3, 30)}<path d="M24 60c0 20 16 32 36 32s36-12 36-32" fill="${T}"/><path d="M30 72c8 10 18 14 30 14" stroke="${G}" stroke-width="1.5" fill="none" opacity=".8"/>`;
      break;
    case "grain":
      s = v % 2
        ? `<path d="M22 64c10-14 66-14 76 0l-6 20c-14 8-50 8-64 0z" fill="${T}"/>${grains(60, 58, 40, G, 4.5, 2.2, 30)}`
        : `<path d="M38 30h44l6 58c-14 8-42 8-56 0z" fill="${G}" opacity=".9"/><path d="M38 30h44l2 14H36z" fill="${T}"/><circle cx="60" cy="66" r="10" fill="none" stroke="${T}" stroke-width="1.4"/><path d="M60 58v16M55 62l5 4 5-4" stroke="${T}" stroke-width="1.4" fill="none"/>`;
      break;
    case "fish": {
      const body = [G, G, T, G][v % 4], fin = [R, T, G, T][v % 4], scale = v % 4 === 3 ? 0.9 : 1;
      s = `<g transform="translate(60 62) scale(${scale}) translate(-60 -62)"><path d="M18 62c14-20 52-24 74 0-22 24-60 20-74 0z" fill="${body}"/><path d="M92 62l18-14v28z" fill="${fin}"/><path d="M50 46c6-6 16-8 22-4" stroke="${fin}" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="32" cy="58" r="3.2" fill="${T}"/><circle cx="32" cy="58" r="1.2" fill="${I}"/><path d="M42 52c-3 6-3 14 0 20" stroke="${T}" stroke-width="1.3" fill="none" opacity=".7"/>${[0, 1, 2, 3].map((i) => `<path d="M${52 + i * 9} 56c3 3 3 9 0 12" stroke="${I}" stroke-width="1.2" fill="none" opacity=".7"/>`).join("")}</g><path d="M14 92h92" stroke="${T}" stroke-width="1" opacity=".3"/>`;
      break;
    }
    case "prawn":
      s = `<path d="M40 40c30-12 52 8 46 32-4 16-22 22-36 14" fill="none" stroke="${R}" stroke-width="18" stroke-linecap="round"/>${[0, 1, 2, 3, 4].map((i) => { const a = ((-60 + i * 36) * Math.PI) / 180; const x = 62 + Math.cos(a) * 24, y = 60 + Math.sin(a) * 24; return `<path d="M${(x - 6).toFixed(1)} ${(y - 3).toFixed(1)}l12 6" stroke="${I}" stroke-width="1.6" opacity=".8"/>`; }).join("")}<path d="M42 38l-14-14M44 36l-6-18" stroke="${T}" stroke-width="1.4" stroke-linecap="round"/><circle cx="42" cy="44" r="2.4" fill="${T}"/><path d="M50 86l-10 8 4-12" fill="${G}"/>`;
      break;
    case "shutki":
      s = `<path d="M10 26h100" stroke="${T}" stroke-width="2"/>${[0, 1, 2].map((i) => { const x = 30 + i * 30, h = [54, 62, 48][(i + v) % 3], col = v % 3 === 2 ? R : G; return `<path d="M${x} 26v6" stroke="${T}" stroke-width="1.4"/><path d="M${x} 32c8 6 8 ${h - 14} 0 ${h}c-8-6-8-${h - 14} 0-${h}z" fill="${col}"/><path d="M${x} ${32 + h}l-6 10h12z" fill="${T}" opacity=".9"/><path d="M${x} 38v${h - 12}" stroke="${T}" stroke-width=".9" opacity=".6"/>`; }).join("")}`;
      break;
    case "spice": {
      const col = [G, R, G][v % 3];
      s = `<ellipse cx="60" cy="80" rx="42" ry="10" fill="${T}"/><path d="M26 78c4-26 20-38 34-38s30 12 34 38z" fill="${col}"/>${v % 3 === 2 ? `<path d="M26 78c4-26 20-38 34-38s30 12 34 38z" fill="${T}" opacity=".25"/>` : ""}${grains(60, 66, 22, I, 1.4, 1, 24)}<path d="M84 30c6 4 8 12 4 16" stroke="${T}" stroke-width="1.5" fill="none"/><ellipse cx="80" cy="34" rx="7" ry="4" transform="rotate(-30 80 34)" fill="${T}" opacity=".8"/>`;
      break;
    }
    case "seed":
      s = `<ellipse cx="60" cy="80" rx="42" ry="10" fill="${T}"/>${grains(60, 64, 70, G, 4, 1.3, 34)}${grains(60, 64, 30, T, 4, 1.3, 30)}`;
      break;
    case "dal": {
      const col = v % 2 ? G : R;
      s = `<path d="M22 58c0 22 16 32 38 32s38-10 38-32z" fill="${T}"/><ellipse cx="60" cy="58" rx="38" ry="12" fill="${col}"/>${grains(60, 57, 60, v % 2 ? T : I, 1.8, 1.6, 32)}<ellipse cx="60" cy="58" rx="38" ry="12" fill="none" stroke="${T}" stroke-width="1.2"/>`;
      break;
    }
    case "chola":
      s = `<path d="M22 60c0 22 16 30 38 30s38-8 38-30z" fill="${T}"/><ellipse cx="60" cy="60" rx="38" ry="12" fill="${G}"/>${Array.from({ length: 18 }, (_, i) => { const a = i * 2.4, r = Math.sqrt(i / 18) * 30; const x = 60 + Math.cos(a) * r, y = 58 + Math.sin(a) * r * 0.36; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${G}" stroke="${T}" stroke-width=".8"/>`; }).join("")}`;
      break;
    case "oil":
      s = `<path d="M52 18h16v12l8 10v52a8 8 0 0 1-8 8H52a8 8 0 0 1-8-8V40l8-10z" fill="${G}"/><path d="M44 54h32v26H44z" fill="${T}"/><text x="60" y="70" text-anchor="middle" font-family="Georgia,serif" font-size="9" fill="${I}" font-style="italic">ghani</text><rect x="51" y="12" width="18" height="8" rx="2" fill="${T}"/><path d="M50 44c3-4 6-6 10-6" stroke="${I}" stroke-width="2" fill="none" opacity=".6" stroke-linecap="round"/>`;
      break;
    case "honey":
      s = `<rect x="34" y="40" width="52" height="56" rx="12" fill="${G}"/><rect x="32" y="28" width="56" height="14" rx="4" fill="${T}"/><path d="M60 42v10c0 4 4 4 4 8" stroke="${R}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M44 64l8-5 8 5v9l-8 5-8-5z M60 64l8-5 8 5v9l-8 5-8-5z" fill="none" stroke="${T}" stroke-width="1.3" opacity=".7"/><path d="M40 50v30" stroke="${I}" stroke-width="3" opacity=".5" stroke-linecap="round"/>`;
      break;
    case "ghee":
      s = `<path d="M36 46h48l-4 44a6 6 0 0 1-6 6H46a6 6 0 0 1-6-6z" fill="${I}" stroke="${T}" stroke-width="1.6"/><path d="M38 60h44l-3 30a6 6 0 0 1-6 6H47a6 6 0 0 1-6-6z" fill="${G}"/><rect x="33" y="34" width="54" height="14" rx="4" fill="${T}"/>${grains(60, 76, 24, I, 1.6, 1.2, 16)}`;
      break;
    case "gur":
      s = `${[[60, 82], [42, 70], [78, 70], [60, 56]].map(([x, y]) => `<ellipse cx="${x}" cy="${y + 8}" rx="18" ry="6" fill="${T}" opacity=".9"/><ellipse cx="${x}" cy="${y}" rx="18" ry="6" fill="${G}"/><path d="M${x - 18} ${y}v8c0 3 8 6 18 6s18-3 18-6v-8" fill="${G}" opacity=".85"/><ellipse cx="${x}" cy="${y}" rx="11" ry="3.4" fill="none" stroke="${T}" stroke-width="1" opacity=".5"/>`).join("")}<path d="M88 24c-6 10-6 18 0 26" stroke="${T}" stroke-width="1.5" fill="none"/><path d="M88 24c8 4 12 2 16-4M88 34c8 2 12-2 14-8" stroke="${T}" stroke-width="1.3" fill="none"/>`;
      break;
    case "doi":
      s = `<path d="M30 52h60l-6 34c-2 8-12 12-24 12s-22-4-24-12z" fill="${R}"/><ellipse cx="60" cy="52" rx="30" ry="9" fill="${I}" stroke="${R}" stroke-width="3"/><ellipse cx="60" cy="52" rx="22" ry="5" fill="${G}" opacity=".5"/><path d="M36 66h48" stroke="${I}" stroke-width="1.2" opacity=".6"/><path d="M38 74h44" stroke="${I}" stroke-width="1.2" opacity=".4"/>`;
      break;
    case "citrus":
      s = `<circle cx="54" cy="66" r="28" fill="${G}"/><circle cx="54" cy="66" r="28" fill="none" stroke="${T}" stroke-width="1.2" opacity=".5"/>${Array.from({ length: 12 }, (_, i) => { const a = (i * 30 * Math.PI) / 180; return `<circle cx="${(54 + Math.cos(a) * 16).toFixed(1)}" cy="${(66 + Math.sin(a) * 16).toFixed(1)}" r="1.4" fill="${T}" opacity=".45"/>`; }).join("")}<path d="M70 40c10-14 24-14 30-10-6 10-18 16-30 10z" fill="${T}"/><path d="M68 42l-6-6" stroke="${T}" stroke-width="2" stroke-linecap="round"/><circle cx="86" cy="86" r="12" fill="${G}" opacity=".85"/>`;
      break;
  }
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${bg}${s}</svg>`;
}
