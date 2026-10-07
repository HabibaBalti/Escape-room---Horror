/* ==========================================================================
   THE WALL BETWEEN US — art.js
   All artwork is hand-built SVG: heavy ink lines, cross-hatching, spirals and
   procedurally generated hair, tinted in sickly colour.
   ========================================================================== */
const ART = (() => {
  const INK = '#150d11';
  const BONE = '#efe4d2';
  const BLOOD = '#a11d26';
  const HAIR = '#120a0e';
  const BRASS = '#b08d4a';

  /* ---------- helpers ---------- */
  function rng(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const f1 = (n) => n.toFixed(1);

  // Archimedean spiral from centre outward. cw = clockwise on screen.
  function spiral(cx, cy, turns, r, cw = true, steps = 160, r0 = 0) {
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = t * turns * Math.PI * 2 * (cw ? 1 : -1);
      const rr = r0 + t * (r - r0);
      d += (i ? 'L' : 'M') + f1(cx + rr * Math.cos(a)) + ' ' + f1(cy + rr * Math.sin(a));
    }
    return d;
  }

  // A fall of hair strands hanging from a line.
  function hair(x0, y0, width, len, count, seed, o = {}) {
    const R = rng(seed);
    let out = '';
    for (let i = 0; i < count; i++) {
      const x = x0 + R() * width;
      const l = len * (0.75 + R() * 0.35);
      const w = (R() - 0.5) * (o.sway ?? 30);
      const x1 = x + w;
      const x2 = x - w * 0.6 + (R() - 0.5) * 20;
      const x3 = x + (R() - 0.5) * (o.end ?? 40);
      out += `<path d="M${f1(x)} ${y0} C${f1(x1)} ${f1(y0 + l * 0.33)} ${f1(x2)} ${f1(y0 + l * 0.66)} ${f1(x3)} ${f1(y0 + l)}" stroke="${o.color || HAIR}" stroke-width="${f1((o.w || 1.4) * (0.6 + R() * 0.8))}" fill="none" stroke-linecap="round" opacity="${(0.55 + R() * 0.45).toFixed(2)}"/>`;
    }
    return out;
  }

  /* ---------- shared <defs> (patterns, filters, gradients) ---------- */
  function defs() {
    return `
    <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><line x1="0" y1="0" x2="0" y2="7" stroke="${INK}" stroke-width="1.3"/></pattern>
    <pattern id="hatchR" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-50)"><line x1="0" y1="0" x2="0" y2="7" stroke="${INK}" stroke-width="1.1"/></pattern>
    <pattern id="hatchFine" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><line x1="0" y1="0" x2="0" y2="4" stroke="${INK}" stroke-width=".7"/></pattern>
    <pattern id="cross" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0L8 8M8 0L0 8" stroke="${INK}" stroke-width=".9"/></pattern>
    <pattern id="wallSpiral" width="90" height="90" patternUnits="userSpaceOnUse"><path d="${spiral(45, 45, 2.6, 16)}" stroke="#6e4f32" stroke-width="1.1" fill="none" opacity=".35"/><circle cx="0" cy="0" r="2" fill="#6e4f32" opacity=".3"/><circle cx="90" cy="90" r="2" fill="#6e4f32" opacity=".3"/></pattern>
    <pattern id="stripes" width="44" height="10" patternUnits="userSpaceOnUse"><rect width="20" height="10" fill="#b77f84" opacity=".35"/><line x1="31" y1="0" x2="31" y2="10" stroke="#6b4a5a" stroke-width=".8" opacity=".5"/></pattern>
    <pattern id="wood" width="120" height="16" patternUnits="userSpaceOnUse"><rect width="120" height="16" fill="#5a3826"/><path d="M0 5 Q30 2 60 6 T120 4 M0 12 Q40 9 80 13 T120 11" stroke="#2c1a12" stroke-width="1" fill="none" opacity=".7"/></pattern>
    <pattern id="woodV" width="16" height="120" patternUnits="userSpaceOnUse"><rect width="16" height="120" fill="#553423"/><path d="M5 0 Q2 30 6 60 T4 120 M12 0 Q9 40 13 80 T11 120" stroke="#2a180f" stroke-width="1" fill="none" opacity=".7"/></pattern>
    <filter id="ink" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="crayon" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="soot" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".08" numOctaves="3" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="8" result="d"/><feGaussianBlur in="d" stdDeviation="1.4"/></filter>
    <filter id="blur4"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="blur12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
    <radialGradient id="vignette" cx="50%" cy="45%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".78"/></radialGradient>
    <radialGradient id="bulbGlow"><stop offset="0" stop-color="#ffe9a6" stop-opacity=".55"/><stop offset="1" stop-color="#ffe9a6" stop-opacity="0"/></radialGradient>
    <radialGradient id="candleGlow"><stop offset="0" stop-color="#ffb24a" stop-opacity=".6"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient>
    <linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b111c"/><stop offset="1" stop-color="#25364a"/></linearGradient>
    <radialGradient id="glass" cx="40%" cy="35%"><stop offset="0" stop-color="#3d434b"/><stop offset="1" stop-color="#0b0c0f"/></radialGradient>
    <radialGradient id="porcelain" cx="38%" cy="32%"><stop offset="0" stop-color="#fdf8ee"/><stop offset="1" stop-color="#d6c5ab"/></radialGradient>
    <radialGradient id="brass" cx="35%" cy="30%"><stop offset="0" stop-color="#e2c27a"/><stop offset="1" stop-color="#7a5a26"/></radialGradient>
    <radialGradient id="lampOn"><stop offset="0" stop-color="#fff6c4"/><stop offset=".6" stop-color="#ffc94a"/><stop offset="1" stop-color="#a8641a"/></radialGradient>`;
  }

  /* ---------- the eight carved symbols (stroke = currentColor) ---------- */
  const SYM = {
    eye: `<path d="M8 50 Q50 12 92 50 Q50 88 8 50Z" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="50" cy="50" r="5" fill="currentColor"/><path d="M22 34 L16 22 M38 26 L35 12 M62 26 L65 12 M78 34 L84 22" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`,
    tooth: `<path d="M28 16 Q50 4 72 16 Q86 38 74 56 L67 92 Q60 96 56 72 Q50 60 44 72 Q40 96 33 92 L26 56 Q14 38 28 16Z" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><path d="M38 26 Q50 20 62 26" stroke="currentColor" stroke-width="3" fill="none"/>`,
    moth: `<path d="M50 30 Q16 4 8 34 Q10 56 48 50Z M50 30 Q84 4 92 34 Q90 56 52 50Z M49 52 Q22 60 26 88 Q40 88 49 60Z M51 52 Q78 60 74 88 Q60 88 51 60Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M50 26 L50 74" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><path d="M48 26 Q40 10 30 6 M52 26 Q60 10 70 6" stroke="currentColor" stroke-width="3" fill="none"/><circle cx="28" cy="32" r="5" fill="currentColor"/><circle cx="72" cy="32" r="5" fill="currentColor"/>`,
    hand: `<path d="M32 94 L24 60 Q20 50 28 48 Q34 47 37 56 L40 64 L38 16 Q38 9 44 9 Q50 9 50 16 L51 46 L52 8 Q52 2 58 2 Q64 2 64 8 L64 46 L67 14 Q68 8 74 9 Q79 10 78 17 L76 50 L81 28 Q83 22 88 24 Q92 26 90 33 L84 70 Q80 90 66 96Z" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round"/>`,
    knot: `<path d="M14 88 C30 72 34 58 50 50 C70 42 88 30 82 17 C76 5 54 12 50 50 C46 88 26 96 19 81 C12 66 34 54 50 50 C66 46 82 62 88 88" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>`,
    spiral: `<path d="${spiral(50, 50, 3, 40, true)}" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>`,
    moon: `<path d="M62 10 A40 40 0 1 0 62 90 A50 50 0 0 1 62 10Z" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>`,
    mouth: `<path d="M8 50 Q50 20 92 50 Q50 80 8 50Z" fill="none" stroke="currentColor" stroke-width="5"/><path d="M8 50 L92 50" stroke="currentColor" stroke-width="3"/><path d="M26 36 L26 64 M38 31 L38 69 M50 29 L50 71 M62 31 L62 69 M74 36 L74 64" stroke="currentColor" stroke-width="3"/>`,
  };
  const SYM_ORDER = ['moth', 'eye', 'hand', 'moon', 'tooth', 'spiral', 'knot', 'mouth'];
  function sym(name, x, y, size, color, extra = '') {
    return `<g transform="translate(${x} ${y}) scale(${size / 100})" style="color:${color}" ${extra}>${SYM[name]}</g>`;
  }
  function symSVG(name, color = INK) {
    return `<svg viewBox="0 0 100 100" aria-hidden="true">${sym(name, 0, 0, 100, color)}</svg>`;
  }

  /* ---------- hair glyphs (grandmother's stitch-chart) ---------- */
  const GLYPH = {
    S: spiral(50, 50, 2.4, 38, true),
    O: spiral(50, 50, 2.4, 38, false),
    I: 'M50 90 L50 32 M50 32 C30 6 70 6 50 32',
    T: 'M50 90 L50 12 M18 34 Q50 22 80 38 Q86 48 78 58',
    E: 'M14 28 q12 -10 24 0 t24 0 t24 0 M14 50 q12 -10 24 0 t24 0 t24 0 M14 72 q12 -10 24 0 t24 0 t24 0',
    R: 'M35 40 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 M58 52 Q76 72 70 94',
    D: 'M35 40 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 M58 52 Q76 72 70 94 M42 52 Q24 72 30 94',
    A: 'M50 10 C82 54 76 88 50 88 C24 88 18 54 50 10Z',
    N: 'M16 16 Q50 44 84 84 M84 16 Q50 44 16 84',
    W: 'M10 28 L30 76 L50 34 L70 76 L90 28',
    M: 'M50 50 m-34 0 a34 34 0 1 0 68 0 a34 34 0 1 0 -68 0 M50 50 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0',
    H: 'M28 10 L28 90 M72 10 L72 90 M28 52 Q39 38 50 52 T72 52',
  };
  function glyph(ch, x, y, size, color = INK) {
    const d = GLYPH[ch];
    const k = size / 100;
    return `<g transform="translate(${x} ${y}) scale(${k})" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="${d}" stroke="${color}" stroke-width="${3.4 / Math.max(k, 0.4)}"/>
      <path d="${d}" stroke="${color}" stroke-width="${1.1 / Math.max(k, 0.4)}" opacity=".55" transform="translate(2.5 1.5)"/>
      <path d="${d}" stroke="${color}" stroke-width="${0.9 / Math.max(k, 0.4)}" opacity=".45" transform="translate(-2 2.5)"/>
    </g>`;
  }

  /* ---------- a Junji-Ito-style face ---------- */
  function face(o = {}) {
    const R = rng(o.seed || 5);
    const skin = o.skin || '#f1e3cc';
    const irisC = o.iris || BLOOD;
    let s = `<svg viewBox="0 0 300 380" class="face" aria-hidden="true">`;
    if (o.hair === 'bob') {
      s += `<path d="M58 110 Q46 22 150 18 Q254 22 242 110 L248 236 Q200 254 150 250 Q100 254 52 236Z" fill="${HAIR}"/>`;
    } else {
      s += `<path d="M52 110 Q40 18 150 14 Q262 18 250 110 Q262 250 290 380 L10 380 Q40 250 52 110Z" fill="${HAIR}"/>`;
      s += hair(30, 90, 240, 300, 70, (o.seed || 5) + 1, { color: '#3a2630', w: 1.2, sway: 24 });
    }
    s += `<path d="M122 262 L120 330 Q150 342 180 330 L178 262Z" fill="${skin}" stroke="${INK}" stroke-width="3"/><path d="M122 262 L122 300 L178 290 L178 262Z" fill="url(#hatch)" opacity=".55"/>`;
    s += `<path d="M30 380 Q56 330 120 322 Q150 340 180 322 Q244 330 270 380Z" fill="${o.dress || '#3b2a3f'}" stroke="${INK}" stroke-width="3"/><path d="M30 380 Q56 330 120 322 L110 380Z" fill="url(#hatch)" opacity=".5"/>`;
    const F = 'M84 120 Q84 62 150 58 Q216 62 216 120 Q218 214 186 258 Q150 290 114 258 Q82 214 84 120Z';
    s += `<path d="${F}" fill="${skin}" stroke="${INK}" stroke-width="3.5"/>`;
    s += `<path d="M84 120 Q82 214 114 258 Q102 210 102 160 Q100 128 92 112Z" fill="url(#hatch)" opacity=".55"/>`;
    s += `<path d="M216 120 Q218 214 186 258 Q204 214 206 150Z" fill="url(#hatchFine)" opacity=".5"/>`;
    // dread lines down the forehead — the signature of fear
    for (let i = 0; i < 16; i++) {
      const x = 104 + i * 6.2;
      s += `<line x1="${f1(x)}" y1="${f1(66 + R() * 8)}" x2="${f1(x + (R() - 0.5) * 2)}" y2="${f1(98 + R() * 14)}" stroke="${INK}" stroke-width=".9" opacity="${o.grin ? 0.8 : 0.5}"/>`;
    }
    [[122, 150], [178, 150]].forEach(([x, y], k) => {
      const ry = o.grin ? 19 : 14;
      s += `<path d="M${x - 25} ${y} Q${x} ${y - ry - 6} ${x + 25} ${y} Q${x} ${y + ry} ${x - 25} ${y}Z" fill="#fbf7ee" stroke="${INK}" stroke-width="3"/>`;
      const ir = o.grin ? 7 : 9;
      s += `<circle cx="${x}" cy="${y}" r="${ir}" fill="${irisC}" stroke="${INK}" stroke-width="1.5"/>`;
      if (o.spiral) s += `<path d="${spiral(x, y, 3, ir - 0.5, k === 0, 80)}" stroke="${INK}" stroke-width="1" fill="none"/>`;
      s += `<circle cx="${x}" cy="${y}" r="${o.grin ? 1.6 : 2.6}" fill="${INK}"/>`;
      s += `<path d="M${x - 27} ${y - 3} Q${x} ${y - ry - 12} ${x + 27} ${y - 3}" stroke="${INK}" stroke-width="3" fill="none"/>`;
      s += `<path d="M${x - 18} ${y + 18} Q${x} ${y + 26} ${x + 18} ${y + 18} M${x - 14} ${y + 24} Q${x} ${y + 31} ${x + 14} ${y + 24}" stroke="${INK}" stroke-width="1.2" fill="none" opacity=".7"/>`;
      if (o.blood) s += `<path d="M${x - 4} ${y + 12} C${x - 8} ${y + 40} ${x + 2} ${y + 60} ${x - 3} ${y + 96}" stroke="${BLOOD}" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="${x - 3}" cy="${y + 99}" r="4" fill="${BLOOD}"/>`;
    });
    s += `<path d="M98 120 Q120 ${o.grin ? 104 : 112} 140 124 M160 124 Q180 ${o.grin ? 104 : 112} 202 120" stroke="${INK}" stroke-width="3" fill="none"/>`;
    s += `<path d="M152 162 Q146 190 156 198 Q150 202 143 199" stroke="${INK}" stroke-width="2.2" fill="none"/>`;
    if (o.grin) {
      s += `<path d="M94 212 Q150 284 206 212 Q150 236 94 212Z" fill="#2a080d" stroke="${INK}" stroke-width="3"/>`;
      for (let i = 1; i < 18; i++) {
        const u = i / 18;
        const x = 94 + 112 * u;
        const yt = 212 + 48 * u * (1 - u);
        const yb = 212 + 144 * u * (1 - u);
        s += `<path d="M${f1(x - 3)} ${f1(yt)} L${f1(x)} ${f1(yt + 13)} L${f1(x + 3)} ${f1(yt)}Z" fill="#efe6d2" stroke="${INK}" stroke-width=".8"/>`;
        s += `<path d="M${f1(x - 3)} ${f1(yb)} L${f1(x)} ${f1(yb - 11)} L${f1(x + 3)} ${f1(yb)}Z" fill="#efe6d2" stroke="${INK}" stroke-width=".8"/>`;
      }
    } else if (o.stitch) {
      s += `<path d="M124 228 Q150 236 176 228" stroke="${INK}" stroke-width="2.6" fill="none"/>`;
      for (let i = 0; i < 6; i++) s += `<line x1="${130 + i * 8}" y1="222" x2="${132 + i * 8}" y2="240" stroke="${INK}" stroke-width="2"/>`;
    } else {
      s += `<path d="M128 228 Q150 234 172 228" stroke="${INK}" stroke-width="2.6" fill="none"/>`;
    }
    if (o.hair === 'bob') {
      s += `<path d="M82 128 Q78 52 150 48 Q222 52 218 128 Q206 96 196 104 Q190 82 176 98 Q166 74 150 96 Q134 74 124 98 Q110 82 104 104 Q94 96 82 128Z" fill="${HAIR}"/>`;
    } else {
      s += `<path d="M84 142 Q74 54 150 46 Q226 54 216 142 Q206 90 178 76 Q160 98 150 70 Q138 100 120 76 Q94 92 84 142Z" fill="${HAIR}"/>`;
    }
    s += hair(92, 62, 116, 170, o.grin ? 16 : 5, (o.seed || 5) + 3, { color: HAIR, w: 1.1, sway: 34, end: 34 });
    if (o.ribbon) s += `<path d="M206 70 L182 52 L186 88Z M206 70 L230 52 L226 88Z" fill="${o.ribbon}" stroke="${INK}" stroke-width="2.5"/><circle cx="206" cy="70" r="6" fill="${o.ribbon}" stroke="${INK}" stroke-width="2.5"/>`;
    s += `</svg>`;
    return s;
  }

  /* ---------- room pieces ---------- */
  function hs(id, label, bbox, inner) {
    const [x, y, w, h] = bbox;
    return `<g class="hs" data-hs="${id}" tabindex="0" role="button" aria-label="${label}"><title>${label}</title><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent"/>${inner}</g>`;
  }
  function floor(c) {
    let s = `<rect y="560" width="1200" height="140" fill="${c}"/>`;
    for (let x = -700; x <= 1900; x += 110) s += `<line x1="${x}" y1="560" x2="${f1(600 + (x - 600) * 1.6)}" y2="700" stroke="${INK}" stroke-width="1.5" opacity=".55"/>`;
    [584, 614, 652].forEach((y) => (s += `<line x1="0" y1="${y}" x2="1200" y2="${y}" stroke="${INK}" stroke-width="1" opacity=".35"/>`));
    s += `<rect y="560" width="1200" height="140" fill="url(#hatchR)" opacity=".28"/><rect y="548" width="1200" height="14" fill="#24150f"/>`;
    return s;
  }
  function vignette() {
    return `<rect width="1200" height="700" fill="url(#vignette)" pointer-events="none"/>`;
  }
  function ringsSmall(cx, cy, done) {
    let s = '';
    [44, 33, 22, 11].forEach((r) => (s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${BRASS}" stroke-width="4"/>`));
    s += `<path d="${spiral(cx, cy, 3, 44, true, 90)}" stroke="${INK}" stroke-width="1" fill="none" opacity=".6"/>`;
    if (done) s += `<circle cx="${cx}" cy="${cy}" r="48" fill="none" stroke="#ffcf6a" stroke-width="3" opacity=".8"/>`;
    return s;
  }
  function door(open) {
    let s = `<rect x="1060" y="100" width="136" height="462" fill="#2e1c13" stroke="${INK}" stroke-width="4"/>`;
    if (open) {
      s += `<rect x="1072" y="112" width="114" height="448" fill="#030203"/><path d="${spiral(1129, 330, 5, 60, true, 200)}" stroke="#4a1218" stroke-width="2" fill="none"/>`;
      s += `<path d="M1072 112 L1110 96 L1110 576 L1072 560Z" fill="url(#woodV)" stroke="${INK}" stroke-width="3"/>`;
    } else {
      s += `<rect x="1072" y="112" width="114" height="448" fill="url(#woodV)" stroke="${INK}" stroke-width="3"/>`;
      s += `<rect x="1084" y="128" width="90" height="120" fill="none" stroke="${INK}" stroke-width="2" opacity=".6"/><rect x="1084" y="410" width="90" height="130" fill="none" stroke="${INK}" stroke-width="2" opacity=".6"/>`;
      s += ringsSmall(1129, 330, false);
      s += `<rect x="1072" y="112" width="114" height="448" fill="url(#hatch)" opacity=".25"/>`;
    }
    return s;
  }

  /* ---------- mini doll (room view) ---------- */
  function miniDoll(cx, o) {
    let s = '';
    if (o.hair === 'long') s += hair(cx - 12, 208, 24, 120, 26, 77, { sway: 10, end: 16, w: 1.2 });
    s += `<path d="M${cx - 9} 226 L${cx + 9} 226 L${cx + 16} 250 L${cx - 16} 250Z" fill="${o.dress}" stroke="${INK}" stroke-width="1.5"/>`;
    s += `<circle cx="${cx}" cy="212" r="13" fill="url(#porcelain)" stroke="${INK}" stroke-width="1.8"/>`;
    s += `<path d="M${cx - 14} 214 Q${cx - 14} 196 ${cx} 196 Q${cx + 14} 196 ${cx + 14} 214 Q${cx + 8} 204 ${cx} 205 Q${cx - 8} 204 ${cx - 14} 214Z" fill="${HAIR}"/>`;
    s += o.missingEye ? `<circle cx="${cx - 4}" cy="212" r="1.8" fill="${INK}"/><circle cx="${cx + 4}" cy="212" r="3" fill="${INK}"/>` : `<circle cx="${cx - 4}" cy="212" r="1.8" fill="${INK}"/><circle cx="${cx + 4}" cy="212" r="1.8" fill="${INK}"/>`;
    if (o.tears) s += `<path d="M${cx - 4} 214 L${cx - 4} 224 M${cx + 4} 214 L${cx + 4} 224" stroke="${INK}" stroke-width="1.4"/>`;
    s += `<line x1="${cx - 5}" y1="218" x2="${cx + 5}" y2="218" stroke="#5a1a1e" stroke-width="1"/>`;
    if (o.ribbon) s += `<path d="M${cx + 9} 199 l-6 -4 l1 8z M${cx + 9} 199 l6 -4 l-1 8z" fill="${o.ribbon}" stroke="${INK}" stroke-width=".8"/>`;
    return s;
  }

  const DOLLS = [
    { dress: '#55657a', hair: 'bob', ribbon: '#3a64b0', stitches: 5 },
    { dress: '#6b4b63', hair: 'mid', tears: true, stitches: 4 },
    { dress: '#7a5a44', hair: 'bob', ribbon: '#c0202a', stitches: 6 },
    { dress: '#4e5c48', hair: 'long', stitches: 8, seed: 31 },
    { dress: '#6e6754', hair: 'short', missingEye: true, stitches: 3 },
  ];

  /* ======================= SAYA — THE DOLL ATELIER ======================= */
  function sayaRoom(S) {
    const f = S.flags, sv = S.solved;
    let s = `<svg viewBox="0 0 1200 700" class="room-svg" preserveAspectRatio="xMidYMid meet">`;
    s += `<rect width="1200" height="700" fill="#d4bd96"/><rect width="1200" height="560" fill="url(#wallSpiral)"/>`;
    s += `<g opacity=".28">${Array.from({ length: 25 }, (_, i) => `<line x1="${i * 50}" y1="384" x2="${i * 50}" y2="550" stroke="${INK}" stroke-width="1"/>`).join('')}</g><line x1="0" y1="384" x2="1200" y2="384" stroke="${INK}" stroke-width="3" opacity=".5"/>`;
    s += `<g filter="url(#ink)" opacity=".35"><path d="M430 0 C440 60 420 120 435 200 C442 240 428 262 438 300" stroke="#6b3a24" stroke-width="16" fill="none"/><ellipse cx="985" cy="110" rx="70" ry="40" fill="#8a6a3a"/><path d="M30 300 q20 40 0 90" stroke="#5a2a1a" stroke-width="10" fill="none"/><path d="M560 30 q-14 60 6 130" stroke="#5a2a1a" stroke-width="6" fill="none"/></g>`;
    s += `<rect width="1200" height="560" fill="url(#hatch)" opacity=".07"/><path d="M0 0 L280 0 Q120 90 0 280Z" fill="url(#cross)" opacity=".35"/><path d="M1200 0 L920 0 Q1080 90 1200 280Z" fill="url(#cross)" opacity=".35"/>`;
    s += floor('#4b2f24');

    // swaying bulb
    s += `<g class="bulb"><line x1="600" y1="0" x2="600" y2="72" stroke="${INK}" stroke-width="2"/><rect x="593" y="66" width="14" height="10" fill="${INK}"/><circle cx="600" cy="88" r="13" fill="#fbeeb0" stroke="${INK}" stroke-width="2"/><circle class="bulbglow" cx="600" cy="100" r="230" fill="url(#bulbGlow)"/></g>`;

    // mannequin
    let m = `<line x1="150" y1="420" x2="150" y2="560" stroke="${INK}" stroke-width="6"/><ellipse cx="150" cy="562" rx="50" ry="9" fill="${INK}"/>`;
    m += `<path d="M110 230 Q100 200 130 190 L170 190 Q200 200 190 230 Q185 300 195 360 Q200 400 175 422 L125 422 Q100 400 105 360 Q115 300 110 230Z" fill="${BONE}" stroke="${INK}" stroke-width="3"/>`;
    m += `<path d="M110 230 Q115 300 105 360 Q100 400 125 422 L135 422 Q120 380 128 300 Q130 240 130 192 Q104 198 110 230Z" fill="url(#hatch)" opacity=".6"/>`;
    m += `<path d="M118 196 Q150 260 186 232 Q176 300 196 380" stroke="#c9a640" stroke-width="5" fill="none"/>`;
    m += `<g stroke="${INK}" stroke-width="1.5">${[[160, 250], [170, 290], [140, 330], [176, 340]].map(([x, y]) => `<line x1="${x}" y1="${y}" x2="${x - 10}" y2="${y - 8}"/><circle cx="${x - 10}" cy="${y - 8}" r="3" fill="${BLOOD}"/>`).join('')}</g>`;
    m += `<rect x="140" y="176" width="20" height="18" fill="${BONE}" stroke="${INK}" stroke-width="2.5"/>`;
    if (f.turned) {
      m += `<g transform="rotate(-16 150 150)"><ellipse cx="150" cy="148" rx="28" ry="34" fill="${BONE}" stroke="${INK}" stroke-width="3"/><path d="M128 120 L172 120" stroke="${INK}" stroke-width="1" opacity=".5"/>`;
      m += `<ellipse cx="139" cy="144" rx="8" ry="6" fill="#fff"/><ellipse cx="161" cy="144" rx="8" ry="6" fill="#fff"/><circle cx="139" cy="144" r="1.5" fill="${INK}"/><circle cx="161" cy="144" r="1.5" fill="${INK}"/>`;
      m += `<path d="M132 162 Q150 182 168 162 Q150 170 132 162Z" fill="#2a080d" stroke="${INK}" stroke-width="1.5"/><path d="M136 164 L164 164" stroke="#efe6d2" stroke-width="2" stroke-dasharray="2 2"/></g>`;
    } else {
      m += `<ellipse cx="150" cy="148" rx="28" ry="34" fill="${BONE}" stroke="${INK}" stroke-width="3"/><path d="M122 148 Q124 120 150 114" stroke="${INK}" stroke-width="1" fill="none" opacity=".4"/><path d="M128 150 Q126 176 150 182 Q132 170 132 150Z" fill="url(#hatch)" opacity=".5"/>`;
    }
    s += hs('mannequin', 'The mannequin', [90, 110, 120, 460], m);

    // speaking pipe
    let p = `<path d="M252 560 L252 452 Q252 424 278 414" stroke="#7a5a26" stroke-width="14" fill="none"/><path d="M252 560 L252 452 Q252 424 278 414" stroke="${BRASS}" stroke-width="8" fill="none"/><path d="M272 400 L300 386 L310 430 L282 428Z" fill="url(#brass)" stroke="${INK}" stroke-width="2.5"/><ellipse cx="305" cy="408" rx="8" ry="22" fill="${INK}" transform="rotate(-12 305 408)"/>`;
    s += hs('pipe', 'A speaking pipe', [240, 380, 80, 180], p);

    // doll shelf
    let d = `<rect x="268" y="250" width="304" height="12" fill="url(#wood)" stroke="${INK}" stroke-width="2"/><rect x="268" y="350" width="304" height="12" fill="url(#wood)" stroke="${INK}" stroke-width="2"/>`;
    d += `<path d="M285 262 L285 290 L300 262Z M555 262 L555 290 L540 262Z M285 362 L285 390 L300 362Z M555 362 L555 390 L540 362Z" fill="#3a2418" stroke="${INK}" stroke-width="1.5"/>`;
    DOLLS.forEach((o, i) => (d += miniDoll(304 + i * 58, o)));
    d += `<rect x="300" y="296" width="44" height="54" rx="6" fill="#4d6a62" opacity=".75" stroke="${INK}" stroke-width="2"/><rect x="298" y="290" width="48" height="8" fill="#2a2a2a"/>`;
    d += `<circle cx="314" cy="318" r="7" fill="#f4efe2" stroke="${INK}"/><circle cx="316" cy="318" r="2.5" fill="${BLOOD}"/><circle cx="330" cy="334" r="6" fill="#f4efe2" stroke="${INK}"/><circle cx="328" cy="335" r="2" fill="${INK}"/>`;
    d += `<rect x="380" y="320" width="28" height="30" fill="#2b2028"/><rect x="380" y="320" width="28" height="30" fill="url(#hatchFine)"/><rect x="430" y="330" width="60" height="20" fill="#7a2a2a" stroke="${INK}"/><rect x="500" y="312" width="22" height="38" fill="#3b3a50" stroke="${INK}"/>`;
    s += hs('dolls', 'The doll shelf', [266, 180, 310, 190], d);

    // hair curtain / lamp panel
    if (!f.cut) {
      let h = `<line x1="608" y1="118" x2="812" y2="118" stroke="${INK}" stroke-width="6"/>`;
      h += `<path d="M614 118 L806 118 L806 352 Q770 396 720 376 Q668 410 614 368Z" fill="${HAIR}" opacity=".92"/>`;
      h += hair(612, 118, 196, 290, 160, 11, { sway: 18, end: 16, w: 1.6 });
      h += `<g class="peek"><ellipse cx="708" cy="248" rx="13" ry="7" fill="#f2ead9"/><circle cx="708" cy="248" r="3.5" fill="${BLOOD}"/><circle cx="708" cy="248" r="1.4" fill="${INK}"/></g>`;
      s += hs('curtain', 'A curtain of hair', [606, 110, 210, 300], h);
    } else {
      let h = `<line x1="608" y1="118" x2="812" y2="118" stroke="${INK}" stroke-width="6"/>`;
      h += `<rect x="636" y="140" width="148" height="236" fill="#2b2a30" stroke="${INK}" stroke-width="4"/><rect x="636" y="140" width="148" height="236" fill="url(#hatchFine)" opacity=".4"/>`;
      const T = ANS_LAMPS;
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        const on = sv.lamps ? T[r * 4 + c] : S.lamps[r * 4 + c];
        h += `<circle cx="${668 + c * 28}" cy="${178 + r * 34}" r="10" fill="${on ? 'url(#lampOn)' : '#4a4038'}" stroke="${INK}" stroke-width="2"/>`;
      }
      h += `<rect x="690" y="320" width="40" height="40" fill="#1a1a1e" stroke="${INK}" stroke-width="2"/><line x1="710" y1="340" x2="${sv.lamps ? 726 : 694}" y2="${sv.lamps ? 360 : 322}" stroke="#888" stroke-width="5"/>`;
      h += hair(612, 118, 22, 60, 16, 12, { sway: 6, end: 6 }) + hair(788, 118, 22, 60, 16, 13, { sway: 6, end: 6 });
      h += `<line x1="710" y1="376" x2="710" y2="420" stroke="${INK}" stroke-width="2" stroke-dasharray="4 3"/>`;
      s += hs('panel', 'The lamp panel', [630, 130, 160, 260], h);
    }

    // desk + drawer
    let k = `<rect x="590" y="402" width="250" height="14" fill="url(#wood)" stroke="${INK}" stroke-width="2.5"/><rect x="600" y="416" width="12" height="144" fill="#3a2418" stroke="${INK}" stroke-width="2"/><rect x="818" y="416" width="12" height="144" fill="#3a2418" stroke="${INK}" stroke-width="2"/>`;
    if (sv.lamps) {
      k += `<rect x="620" y="416" width="190" height="56" fill="#140c0a"/><path d="M610 440 L820 440 L828 506 L602 506Z" fill="url(#wood)" stroke="${INK}" stroke-width="2.5"/><path d="M610 440 L820 440 L816 452 L614 452Z" fill="#0d0706"/>`;
      if (!S.items.cipher) k += `<rect x="660" y="430" width="50" height="16" fill="#efe4d2" transform="rotate(-6 685 438)"/><path d="M740 436 q10 -8 22 0 q-6 10 -22 0Z" fill="#f2e8d8" stroke="${INK}"/>`;
    } else {
      k += `<rect x="620" y="418" width="190" height="56" fill="url(#wood)" stroke="${INK}" stroke-width="2.5"/><circle cx="715" cy="446" r="6" fill="url(#brass)" stroke="${INK}"/>`;
    }
    // severed doll head on the desk
    k += `<circle cx="790" cy="388" r="14" fill="url(#porcelain)" stroke="${INK}" stroke-width="2"/><path d="M776 386 Q778 368 792 370 Q806 372 804 386 Q796 378 790 380 Q782 378 776 386Z" fill="${HAIR}"/><circle cx="786" cy="390" r="1.8" fill="${INK}"/><circle cx="795" cy="390" r="1.8" fill="${INK}"/>`;
    k += `<rect x="634" y="388" width="40" height="14" fill="#3b2c3e" stroke="${INK}"/><circle cx="654" cy="384" r="6" fill="#20141a" stroke="${INK}"/>`;
    s += hs('desk', 'The sewing desk', [588, 368, 256, 192], k);

    // cabinet
    let c = `<path d="M852 222 L1048 222 L1040 238 L860 238Z" fill="#3a2418" stroke="${INK}" stroke-width="3"/><rect x="860" y="238" width="180" height="318" fill="url(#woodV)" stroke="${INK}" stroke-width="4"/>`;
    if (sv.cabinet) {
      c += `<rect x="872" y="250" width="76" height="296" fill="url(#woodV)" stroke="${INK}" stroke-width="2.5"/><rect x="952" y="250" width="76" height="296" fill="#0e0807"/>`;
      c += hair(956, 250, 70, 150, 26, 21, { sway: 8, end: 10 });
      c += `<path d="M952 250 L1012 236 L1012 562 L952 546Z" fill="url(#woodV)" stroke="${INK}" stroke-width="3"/>`;
    } else {
      c += `<rect x="872" y="250" width="76" height="296" fill="url(#woodV)" stroke="${INK}" stroke-width="2.5"/><rect x="952" y="250" width="76" height="296" fill="url(#woodV)" stroke="${INK}" stroke-width="2.5"/>`;
      c += `<rect x="894" y="300" width="112" height="34" fill="url(#brass)" stroke="${INK}" stroke-width="2"/>`;
      SYM_ORDER.forEach((n, i) => (c += sym(n, 897 + i * 13.4, 309, 12, INK)));
      c += `<circle cx="940" cy="420" r="4" fill="${BRASS}"/><circle cx="960" cy="420" r="4" fill="${BRASS}"/>`;
    }
    c += `<rect x="860" y="238" width="180" height="318" fill="url(#hatch)" opacity=".18"/>`;
    s += hs('cabinet', 'The carved cabinet', [850, 215, 200, 345], c);

    s += hs('door', 'The door', [1058, 98, 140, 466], door(!!S.endTime));
    s += vignette() + `</svg>`;
    return s;
  }

  /* ========================== RIN — THE NURSERY ========================== */
  function rinRoom(S) {
    const f = S.flags, sv = S.solved, lit = !!f.lit;
    let s = `<svg viewBox="0 0 1200 700" class="room-svg" preserveAspectRatio="xMidYMid meet">`;
    s += `<rect width="1200" height="700" fill="#c4ac90"/><rect width="1200" height="560" fill="url(#stripes)"/>`;
    // frieze of tiny smiling faces
    s += `<rect x="0" y="62" width="1200" height="22" fill="#d9c6a8" stroke="${INK}" stroke-width="1.5"/>`;
    for (let x = 14; x < 1200; x += 34) s += `<circle cx="${x}" cy="73" r="7" fill="#efe4d2" stroke="${INK}" stroke-width="1"/><circle cx="${x - 2.5}" cy="71.5" r="1" fill="${INK}"/><circle cx="${x + 2.5}" cy="71.5" r="1" fill="${INK}"/><path d="M${x - 3} 75 Q${x} 78 ${x + 3} 75" stroke="${INK}" stroke-width=".8" fill="none"/>`;
    s += `<g filter="url(#ink)" opacity=".3"><path d="M720 0 C730 70 712 150 726 250" stroke="#5a2a2a" stroke-width="14" fill="none"/><ellipse cx="300" cy="420" rx="60" ry="30" fill="#7a5a4a"/></g>`;
    s += `<rect width="1200" height="560" fill="url(#hatch)" opacity=".09"/><path d="M0 0 L300 0 Q130 100 0 300Z" fill="url(#cross)" opacity=".4"/><path d="M1200 0 L900 0 Q1070 100 1200 300Z" fill="url(#cross)" opacity=".4"/>`;
    s += floor('#3e2a26');

    // window
    let w = `<rect x="56" y="88" width="178" height="216" fill="#2a1a14" stroke="${INK}" stroke-width="4"/><rect x="66" y="98" width="158" height="196" fill="url(#night)"/>`;
    w += `<circle cx="186" cy="138" r="22" fill="#e6e0c4"/><path d="${spiral(186, 138, 2, 18, true, 60)}" stroke="#a9a184" stroke-width="1" fill="none"/>`;
    w += `<g class="winface"><ellipse cx="128" cy="210" rx="44" ry="58" fill="#e9dcc7" opacity=".93"/><ellipse cx="112" cy="196" rx="10" ry="7" fill="#fff"/><ellipse cx="146" cy="196" rx="10" ry="7" fill="#fff"/><circle cx="112" cy="196" r="1.6" fill="${INK}"/><circle cx="146" cy="196" r="1.6" fill="${INK}"/><path d="M104 232 Q128 256 152 232 Q128 242 104 232Z" fill="#2a080d"/><path d="M84 190 Q90 140 128 150 Q166 140 172 190" stroke="${HAIR}" stroke-width="10" fill="none"/>${hair(86, 160, 84, 130, 26, 41, { sway: 12 })}<rect x="84" y="150" width="88" height="110" fill="url(#hatchFine)" opacity=".25"/></g>`;
    w += `<line x1="145" y1="98" x2="145" y2="294" stroke="#2a1a14" stroke-width="6"/><line x1="66" y1="196" x2="224" y2="196" stroke="#2a1a14" stroke-width="6"/>`;
    w += `<path d="M44 80 Q70 200 52 320 L90 320 Q76 200 92 80Z M246 80 Q220 200 238 320 L200 320 Q214 200 198 80Z" fill="#a0646a" stroke="${INK}" stroke-width="2.5"/><path d="M44 80 Q70 200 52 320 L90 320 Q76 200 92 80Z M246 80 Q220 200 238 320 L200 320 Q214 200 198 80Z" fill="url(#hatch)" opacity=".5"/>`;
    s += hs('window', 'The window', [44, 80, 204, 244], w);

    // crayon drawing
    let dr = `<g transform="rotate(-3 340 225)"><rect x="262" y="120" width="160" height="210" fill="#f4ecd8" stroke="${INK}" stroke-width="2"/>`;
    dr += `<g filter="url(#crayon)"><path d="M276 312 h18 v-22 h18 v-22 h18 v-22 h18 v-22 h18 v-22 h18 v-22 h18 v-22 h16" stroke="#7a4a2a" stroke-width="3" fill="none"/>`;
    dr += `<circle cx="284" cy="300" r="4" fill="#c4252c"/><circle cx="320" cy="256" r="4" fill="#c4252c"/><circle cx="374" cy="190" r="4" fill="#3f8a3a"/><circle cx="392" cy="168" r="4" fill="#c4252c"/><path d="M404 130 l6 22 m-3 -14 l-6 6" stroke="${INK}" stroke-width="2"/></g>`;
    dr += `<rect x="318" y="114" width="40" height="12" fill="#e9e0a8" opacity=".8"/></g>`;
    s += hs('drawing', "A child's crayon drawing", [256, 108, 172, 232], dr);

    // the shared wall — 4x4 tiles
    let t = `<rect x="460" y="98" width="240" height="240" fill="#bba183" stroke="${INK}" stroke-width="2.5"/>`;
    for (let i = 1; i < 4; i++) t += `<line x1="${460 + i * 60}" y1="98" x2="${460 + i * 60}" y2="338" stroke="${INK}" stroke-width="1.3" opacity=".7"/><line x1="460" y1="${98 + i * 60}" x2="700" y2="${98 + i * 60}" stroke="${INK}" stroke-width="1.3" opacity=".7"/>`;
    t += `<path d="M470 130 l14 18 l-6 14 M640 300 l12 -16 l14 4 M600 120 l-8 22" stroke="${INK}" stroke-width="1" fill="none" opacity=".6"/>`;
    if (lit) {
      const V = rinWallView();
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (V[r * 4 + c]) t += handprint(490 + c * 60, 128 + r * 60, 0.55, r * 4 + c);
    }
    t += `<rect x="460" y="98" width="240" height="240" fill="url(#hatchFine)" opacity=".18"/>`;
    s += hs('wall', 'The wall you share with Saya', [456, 94, 248, 248], t);

    // nightstand + ledger + candle
    let n = `<rect x="280" y="430" width="122" height="128" fill="url(#wood)" stroke="${INK}" stroke-width="3"/><line x1="280" y1="470" x2="402" y2="470" stroke="${INK}" stroke-width="2"/><circle cx="341" cy="450" r="4" fill="${BRASS}"/>`;
    n += `<path d="M292 428 L362 428 L372 414 L302 414Z" fill="#6a2a24" stroke="${INK}" stroke-width="2"/><path d="M292 428 L362 428 L362 432 L292 432Z" fill="#efe4d2"/>`;
    if (S.items.candle || lit) {
      n += `<rect x="376" y="392" width="10" height="38" fill="#efe4d2" stroke="${INK}" stroke-width="1.5"/><path d="M381 392 L381 386" stroke="${INK}" stroke-width="1.5"/>`;
      if (lit) n += `<circle class="candleglow" cx="381" cy="380" r="260" fill="url(#candleGlow)"/><path class="flame" d="M381 366 Q389 378 381 388 Q373 378 381 366Z" fill="#ffd36b" stroke="#e07a1a" stroke-width="1.5"/>`;
    }
    s += hs('ledger', 'The nightstand', [276, 360, 130, 200], n);

    // cradle
    let cr = `<path d="M470 424 Q466 352 552 344 L552 424Z" fill="#8a5a62" stroke="${INK}" stroke-width="2.5"/><path d="M470 424 Q466 352 552 344 L552 424Z" fill="url(#hatch)" opacity=".5"/>`;
    cr += `<path d="M458 424 L692 424 L674 524 L476 524Z" fill="#1a1012"/>`;
    for (let x = 470; x <= 682; x += 15) cr += `<line x1="${x}" y1="424" x2="${x + (575 - x) * 0.08}" y2="524" stroke="#d2bb94" stroke-width="5"/>`;
    cr += `<path d="M458 424 L692 424 L674 524 L476 524Z" fill="none" stroke="${INK}" stroke-width="3"/><rect x="452" y="416" width="246" height="10" fill="#d2bb94" stroke="${INK}" stroke-width="2"/>`;
    cr += `<path d="M436 540 Q575 604 714 540" stroke="#3a2418" stroke-width="10" fill="none"/><line x1="486" y1="524" x2="480" y2="556" stroke="#3a2418" stroke-width="7"/><line x1="664" y1="524" x2="670" y2="556" stroke="#3a2418" stroke-width="7"/>`;
    cr += hair(560, 418, 110, 70, 28, 52, { sway: 12, end: 10 });
    if (!sv.cradle) cr += `<path d="M563 444 Q563 428 575 428 Q587 428 587 444" stroke="#777" stroke-width="4" fill="none"/><rect x="559" y="442" width="32" height="28" rx="3" fill="url(#brass)" stroke="${INK}" stroke-width="2"/><circle cx="575" cy="456" r="3" fill="${INK}"/>`;
    else cr += `<path d="M560 444 Q556 424 548 418" stroke="#777" stroke-width="4" fill="none"/>`;
    s += hs('cradle', 'The cradle', [432, 336, 286, 270], cr);

    // grandfather clock
    let ck = `<path d="M748 80 L842 80 L842 150 L832 160 L832 520 L852 560 L738 560 L758 520 L758 160 L748 150Z" fill="url(#woodV)" stroke="${INK}" stroke-width="4"/>`;
    ck += `<circle cx="795" cy="116" r="31" fill="${BONE}" stroke="${INK}" stroke-width="3"/>`;
    for (let i = 0; i < 12; i++) { const a = (i * 30 * Math.PI) / 180; ck += `<line x1="${f1(795 + Math.sin(a) * 25)}" y1="${f1(116 - Math.cos(a) * 25)}" x2="${f1(795 + Math.sin(a) * 29)}" y2="${f1(116 - Math.cos(a) * 29)}" stroke="${INK}" stroke-width="2"/>`; }
    const ha = (((S.clock.h % 12) + S.clock.m / 60) * 30 * Math.PI) / 180, ma = (S.clock.m * 6 * Math.PI) / 180;
    ck += `<line x1="795" y1="116" x2="${f1(795 + Math.sin(ha) * 15)}" y2="${f1(116 - Math.cos(ha) * 15)}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><line x1="795" y1="116" x2="${f1(795 + Math.sin(ma) * 24)}" y2="${f1(116 - Math.cos(ma) * 24)}" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`;
    ck += `<rect x="772" y="200" width="46" height="280" fill="#140a08" stroke="${INK}" stroke-width="2.5"/>`;
    ck += `<g class="${sv.clock ? 'pendulum swing' : 'pendulum'}"><line x1="795" y1="204" x2="795" y2="430" stroke="${BRASS}" stroke-width="3"/><circle cx="795" cy="438" r="15" fill="url(#brass)" stroke="${INK}" stroke-width="2"/></g>`;
    ck += `<rect x="748" y="80" width="94" height="480" fill="url(#hatch)" opacity=".15"/>`;
    s += hs('clock', 'The grandfather clock', [736, 76, 120, 488], ck);

    // vanity mirror
    let mi = `<ellipse cx="965" cy="250" rx="72" ry="110" fill="#6e4a26" stroke="${INK}" stroke-width="3"/><ellipse cx="965" cy="250" rx="60" ry="98" fill="url(#glass)" stroke="${INK}" stroke-width="2"/>`;
    if (lit) {
      mi += `<g opacity=".9"><ellipse cx="985" cy="300" rx="26" ry="34" fill="#cbbfa8" opacity=".35"/><circle cx="977" cy="296" r="2" fill="#fff" opacity=".9"/><circle cx="993" cy="296" r="2" fill="#fff" opacity=".9"/><path d="M972 312 Q985 322 998 312" stroke="#fff" stroke-width="1.5" fill="none" opacity=".7"/></g>`;
      ['S', 'I', 'S', 'T', 'E', 'R'].forEach((ch, i) => (mi += glyph(ch, 912 + i * 18, 212, 16, '#0a0608')));
    }
    mi += `<path d="M925 180 Q940 160 960 168" stroke="#fff" stroke-width="2" fill="none" opacity=".25"/>`;
    s += hs('mirror', 'The vanity mirror', [890, 136, 150, 228], mi);

    let va = `<rect x="878" y="372" width="174" height="22" fill="url(#wood)" stroke="${INK}" stroke-width="2.5"/><rect x="892" y="394" width="146" height="62" fill="url(#wood)" stroke="${INK}" stroke-width="2.5"/>`;
    va += `<line x1="896" y1="456" x2="890" y2="560" stroke="#3a2418" stroke-width="8"/><line x1="1034" y1="456" x2="1040" y2="560" stroke="#3a2418" stroke-width="8"/>`;
    if (!sv.drawer) va += `<rect x="935" y="412" width="60" height="22" fill="url(#brass)" stroke="${INK}" stroke-width="2"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${938 + i * 9.5}" y="415" width="7" height="16" fill="#2a1c10"/>`).join('')}`;
    else va += `<rect x="892" y="402" width="146" height="10" fill="#0d0706"/>`;
    va += `<path d="M900 372 Q930 352 952 370" stroke="${HAIR}" stroke-width="2" fill="none"/><circle cx="1012" cy="364" r="7" fill="#c49aa0" stroke="${INK}"/>`;
    s += hs('vanity', 'The vanity drawer', [876, 366, 178, 196], va);

    s += hs('door', 'The door', [1058, 98, 140, 466], door(!!S.endTime));
    s += vignette() + `</svg>`;
    return s;
  }

  function handprint(cx, cy, k, seed) {
    const R = rng(seed + 100);
    const rot = (R() - 0.5) * 30;
    let s = `<g transform="translate(${cx} ${cy}) rotate(${f1(rot)}) scale(${k})" filter="url(#soot)" fill="#1a0f0c" opacity=".88">`;
    s += `<ellipse cx="0" cy="12" rx="17" ry="19"/>`;
    [[-17, -12, -28], [-8, -22, -10], [2, -25, 0], [12, -21, 10], [24, 0, 45]].forEach(([x, y, r]) => (s += `<ellipse cx="${x}" cy="${y}" rx="5.5" ry="12" transform="rotate(${r} ${x} ${y})"/>`));
    s += `</g>`;
    return s;
  }

  /* ======================== CLOSE-UP ILLUSTRATIONS ======================== */
  function dollFull(o, x) {
    let s = `<g transform="translate(${x} 0)">`;
    if (o.hair === 'long') {
      s += `<path d="M38 120 Q32 50 90 46 Q148 50 142 120 L156 330 L24 330Z" fill="${HAIR}"/>`;
      s += hair(30, 110, 120, 330, 80, o.seed || 3, { sway: 26, end: 70, w: 1.6 });
    }
    if (o.hair === 'mid') s += `<path d="M36 120 Q30 52 90 48 Q150 52 144 120 L148 206 Q90 196 32 206Z" fill="${HAIR}"/>`;
    s += `<path d="M60 176 L120 176 L152 328 L28 328Z" fill="${o.dress}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M60 176 L28 328 L72 328 L76 190Z" fill="url(#hatch)" opacity=".6"/><path d="M62 176 Q90 198 118 176" fill="#efe4d2" stroke="${INK}" stroke-width="2.5"/>`;
    s += `<circle cx="50" cy="266" r="10" fill="url(#porcelain)" stroke="${INK}" stroke-width="2"/><circle cx="130" cy="266" r="10" fill="url(#porcelain)" stroke="${INK}" stroke-width="2"/>`;
    s += `<rect x="80" y="164" width="20" height="16" fill="url(#porcelain)" stroke="${INK}" stroke-width="2"/>`;
    s += `<circle cx="90" cy="118" r="54" fill="url(#porcelain)" stroke="${INK}" stroke-width="3.5"/><path d="M38 104 Q40 160 90 172 Q56 150 56 108Z" fill="url(#hatch)" opacity=".45"/>`;
    // eyes
    [[68, 114], [112, 114]].forEach(([ex, ey], i) => {
      if (o.missingEye && i === 1) {
        s += `<ellipse cx="${ex}" cy="${ey}" rx="13" ry="11" fill="${INK}"/><path d="${spiral(ex, ey, 2.5, 9, true, 50)}" stroke="${BLOOD}" stroke-width="1.2" fill="none"/>`;
        s += `<path d="M${ex + 12} ${ey - 6} l14 -14 l4 -10 M${ex + 10} ${ey + 8} l12 10 l2 12 M${ex - 4} ${ey - 11} l-4 -16" stroke="${INK}" stroke-width="1.4" fill="none"/>`;
      } else {
        s += `<ellipse cx="${ex}" cy="${ey}" rx="14" ry="11" fill="#fdfaf2" stroke="${INK}" stroke-width="2.5"/><circle cx="${ex}" cy="${ey}" r="6.5" fill="#3c2a40"/><circle cx="${ex}" cy="${ey}" r="2" fill="${INK}"/><circle cx="${ex - 2}" cy="${ey - 2}" r="1.3" fill="#fff"/>`;
        s += `<path d="M${ex - 15} ${ey - 4} Q${ex} ${ey - 20} ${ex + 15} ${ey - 4}" stroke="${INK}" stroke-width="2.5" fill="none"/>`;
      }
    });
    s += `<ellipse cx="58" cy="140" rx="9" ry="5" fill="#d97a7a" opacity=".45"/><ellipse cx="122" cy="140" rx="9" ry="5" fill="#d97a7a" opacity=".45"/>`;
    if (o.tears) [[68, 126], [112, 126]].forEach(([ex, ey]) => (s += `<path d="M${ex} ${ey} C${ex - 4} ${ey + 22} ${ex + 4} ${ey + 34} ${ex} ${ey + 70} L${ex} ${ey + 150}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="${ex}" cy="${ey + 156}" r="5" fill="${INK}"/>`));
    // stitched mouth
    s += `<path d="M58 152 Q90 168 122 152" stroke="#5a1a1e" stroke-width="3" fill="none"/>`;
    const n = o.stitches;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, x = 58 + 64 * u, y = 152 + 16 * u * (1 - u);
      s += `<line x1="${f1(x - 2.5)}" y1="${f1(y - 10)}" x2="${f1(x + 2.5)}" y2="${f1(y + 10)}" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`;
    }
    // hair front
    if (o.hair === 'short') s += `<path d="M38 118 Q34 60 90 58 Q146 60 142 118 Q132 92 112 86 Q100 98 90 84 Q78 98 66 86 Q48 94 38 118Z" fill="${HAIR}"/>`;
    else s += `<path d="M34 132 Q28 58 90 54 Q152 58 146 132 Q140 104 128 96 Q120 110 108 92 Q96 106 90 88 Q80 106 70 92 Q60 108 52 96 Q42 106 34 132Z" fill="${HAIR}"/>`;
    if (o.ribbon) s += `<path d="M126 70 L104 54 L108 90Z M126 70 L148 54 L144 90Z" fill="${o.ribbon}" stroke="${INK}" stroke-width="2.5"/><circle cx="126" cy="70" r="6.5" fill="${o.ribbon}" stroke="${INK}" stroke-width="2.5"/>`;
    s += `</g>`;
    return s;
  }
  function dollsSVG() {
    let s = `<svg viewBox="0 0 940 450" class="closeup">`;
    s += `<rect width="940" height="450" fill="#cdb48e"/><rect width="940" height="450" fill="url(#wallSpiral)"/><rect width="940" height="330" fill="url(#hatch)" opacity=".08"/>`;
    s += `<rect x="0" y="328" width="940" height="22" fill="url(#wood)" stroke="${INK}" stroke-width="3"/><rect x="0" y="350" width="940" height="100" fill="#20130e"/><rect x="0" y="350" width="940" height="100" fill="url(#hatchR)" opacity=".5"/>`;
    DOLLS.forEach((o, i) => (s += dollFull(o, 6 + i * 186)));
    s += `</svg>`;
    return s;
  }

  // the crayon staircase on Rin's wall
  const STAIRS = [
    { s: 'moth', c: '#2a2420' }, { s: 'eye', c: '#c4252c' }, { s: 'hand', c: '#c4252c', broken: true }, { s: 'moon', c: '#2f5fa8' },
    { s: 'tooth', c: '#c4252c' }, { s: 'spiral', c: '#3f8a3a' }, { s: 'knot', c: '#c4252c' }, { s: 'spiral', c: '#c4252c' },
  ];
  function stairsSVG() {
    let s = `<svg viewBox="0 0 720 540" class="closeup">`;
    s += `<rect width="720" height="540" fill="#2a1d18"/><g transform="rotate(-1.5 360 270)"><rect x="14" y="14" width="692" height="512" fill="#f3ead4" stroke="${INK}" stroke-width="2"/><rect x="14" y="14" width="692" height="512" fill="url(#hatchFine)" opacity=".05"/>`;
    s += `<g filter="url(#crayon)">`;
    let d = 'M30 490';
    STAIRS.forEach((st, i) => {
      const x = 40 + i * 76, y = 490 - i * 52;
      d += ` L${x} ${y} L${x + 76} ${y}` + (i < 7 ? ` L${x + 76} ${y - 52}` : '');
      s += sym(st.s, x + 15, y - 48, 44, st.c);
      if (st.broken) s += `<path d="M${x + 6} ${y - 50} L${x + 70} ${y - 2} M${x + 70} ${y - 50} L${x + 6} ${y - 2}" stroke="#1b1512" stroke-width="5"/><path d="M${x + 20} ${y} l8 14 l-6 10 l10 12 M${x + 50} ${y} l-4 18 l8 8" stroke="#1b1512" stroke-width="2.5" fill="none"/><text x="${x + 6}" y="${y + 40}" class="scrawl" font-size="13" fill="#1b1512">broken</text>`;
    });
    s += `<path d="${d}" stroke="#7a4a2a" stroke-width="4" fill="none" stroke-linejoin="round"/>`;
    // the child at the bottom
    s += `<circle cx="50" cy="420" r="9" stroke="#2a2420" stroke-width="3" fill="none"/><path d="M50 429 L50 460 M50 438 L38 448 M50 438 L62 448 M50 460 L42 480 M50 460 L58 480" stroke="#2a2420" stroke-width="3"/>`;
    // the tall thing at the top
    s += `<g stroke="#1b1512" stroke-width="3" fill="none"><ellipse cx="660" cy="44" rx="14" ry="18"/><path d="M660 62 L660 104 M660 74 L640 100 M660 74 L680 100"/><path d="M646 36 Q640 70 634 104 M674 36 Q680 70 688 104 M652 34 Q648 70 646 100 M668 34 Q672 70 676 100" stroke-width="2"/></g>`;
    s += `<path d="${spiral(654, 44, 2, 5, true, 30)}" stroke="#c4252c" stroke-width="2" fill="none"/><path d="${spiral(666, 44, 2, 5, false, 30)}" stroke="#c4252c" stroke-width="2" fill="none"/>`;
    s += `</g>`;
    s += `<text x="40" y="70" class="scrawl" font-size="22" fill="#2a2420">climb from the bottom</text>`;
    s += `<text x="58" y="112" class="scrawl" font-size="22" fill="#2a2420">step only on <tspan fill="#c4252c">RED</tspan></text>`;
    s += `<text x="40" y="168" class="scrawl" font-size="17" fill="#2a2420">never the broken step</text><text x="72" y="196" class="scrawl" font-size="17" fill="#2a2420">or you <tspan fill="#c4252c">FALL</tspan></text>`;
    s += `<text x="470" y="40" class="scrawl" font-size="14" fill="#2a2420" transform="rotate(4 470 40)">mama waits</text>`;
    s += `</g></svg>`;
    return s;
  }

  // Mother's pocket watch — the eye marks 12; the watch lies on its side
  function watchSVG() {
    let s = `<svg viewBox="0 0 420 400" class="closeup">`;
    s += `<rect width="420" height="400" fill="#24171a"/><rect width="420" height="400" fill="url(#hatchR)" opacity=".25"/>`;
    s += `<path d="M362 200 C400 220 400 290 370 330 C340 370 300 380 260 390" stroke="${BRASS}" stroke-width="5" fill="none" stroke-dasharray="8 4"/>`;
    s += `<g transform="translate(200 200) rotate(90)">`;
    s += `<rect x="-11" y="-178" width="22" height="26" rx="4" fill="url(#brass)" stroke="${INK}" stroke-width="2.5"/><circle cx="0" cy="-184" r="9" fill="none" stroke="${BRASS}" stroke-width="5"/>`;
    s += `<circle r="152" fill="url(#brass)" stroke="${INK}" stroke-width="4"/><circle r="130" fill="${BONE}" stroke="${INK}" stroke-width="3"/><circle r="130" fill="url(#hatchFine)" opacity=".12"/>`;
    for (let i = 0; i < 60; i++) {
      const a = (i * 6 * Math.PI) / 180, big = i % 5 === 0;
      s += `<line x1="${f1(Math.sin(a) * (big ? 108 : 118))}" y1="${f1(-Math.cos(a) * (big ? 108 : 118))}" x2="${f1(Math.sin(a) * 125)}" y2="${f1(-Math.cos(a) * 125)}" stroke="${INK}" stroke-width="${big ? 3.5 : 1}"/>`;
    }
    s += sym('eye', -17, -100, 34, BLOOD);
    s += `<path d="${spiral(0, 0, 4, 60, true, 120)}" stroke="${INK}" stroke-width=".7" fill="none" opacity=".35"/>`;
    const ma = (270 * Math.PI) / 180, ha = (142.5 * Math.PI) / 180;
    s += `<path d="M0 0 L${f1(Math.sin(ha) * 66)} ${f1(-Math.cos(ha) * 66)}" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`;
    s += `<path d="M0 0 L${f1(Math.sin(ma) * 104)} ${f1(-Math.cos(ma) * 104)}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
    s += `<circle r="7" fill="${INK}"/><circle r="3" fill="${BRASS}"/>`;
    s += `<path d="M-40 -90 L-10 -30 L-30 10 M-10 -30 L40 -50" stroke="#fff" stroke-width="1.6" fill="none" opacity=".7"/>`;
    s += `</g></svg>`;
    return s;
  }

  function clockSVG(h, m) {
    let s = `<svg viewBox="0 0 320 320" class="closeup clockface">`;
    s += `<rect width="320" height="320" fill="#2a1a12"/><circle cx="160" cy="160" r="150" fill="url(#woodV)" stroke="${INK}" stroke-width="4"/><circle cx="160" cy="160" r="128" fill="${BONE}" stroke="${INK}" stroke-width="3"/><circle cx="160" cy="160" r="128" fill="url(#hatchFine)" opacity=".1"/>`;
    const N = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    N.forEach((t, i) => {
      const a = (i * 30 * Math.PI) / 180;
      s += `<text x="${f1(160 + Math.sin(a) * 100)}" y="${f1(160 - Math.cos(a) * 100 + 7)}" text-anchor="middle" class="roman" font-size="20" fill="${INK}">${t}</text>`;
    });
    for (let i = 0; i < 60; i++) { const a = (i * 6 * Math.PI) / 180; s += `<line x1="${f1(160 + Math.sin(a) * 120)}" y1="${f1(160 - Math.cos(a) * 120)}" x2="${f1(160 + Math.sin(a) * 126)}" y2="${f1(160 - Math.cos(a) * 126)}" stroke="${INK}" stroke-width="${i % 5 ? 1 : 3}"/>`; }
    const ha = (((h % 12) + m / 60) * 30 * Math.PI) / 180, ma = (m * 6 * Math.PI) / 180;
    s += `<line x1="160" y1="160" x2="${f1(160 + Math.sin(ha) * 62)}" y2="${f1(160 - Math.cos(ha) * 62)}" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`;
    s += `<line x1="160" y1="160" x2="${f1(160 + Math.sin(ma) * 100)}" y2="${f1(160 - Math.cos(ma) * 100)}" stroke="${BLOOD}" stroke-width="4" stroke-linecap="round"/>`;
    s += `<circle cx="160" cy="160" r="7" fill="${INK}"/></svg>`;
    return s;
  }

  // what Rin sees: the handprints, from her side of the wall (mirror of Saya's lamps)
  function rinWallView() {
    const V = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) V.push(ANS_LAMPS[r * 4 + (3 - c)]);
    return V;
  }
  function wallSVG(lit) {
    let s = `<svg viewBox="0 0 440 440" class="closeup">`;
    s += `<rect width="440" height="440" fill="${lit ? '#c3a77f' : '#120c0c'}"/>`;
    if (!lit) { s += `<rect width="440" height="440" fill="url(#cross)" opacity=".5"/></svg>`; return s; }
    s += `<rect width="440" height="440" fill="url(#stripes)"/>`;
    for (let i = 0; i <= 4; i++) s += `<line x1="${20 + i * 100}" y1="20" x2="${20 + i * 100}" y2="420" stroke="${INK}" stroke-width="2"/><line x1="20" y1="${20 + i * 100}" x2="420" y2="${20 + i * 100}" stroke="${INK}" stroke-width="2"/>`;
    const V = rinWallView();
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (V[r * 4 + c]) s += handprint(70 + c * 100, 72 + r * 100, 1.25, r * 4 + c);
    s += `<rect width="440" height="440" fill="url(#candleGlow)" opacity=".35"/></svg>`;
    return s;
  }

  const CIPHER = ['A', 'S', 'H', 'O', 'E', 'N', 'R', 'W', 'I', 'D', 'T', 'M'];
  function cipherSVG() {
    let s = `<svg viewBox="0 0 620 550" class="closeup">`;
    s += `<rect width="620" height="550" fill="#2a1d18"/><rect x="12" y="12" width="596" height="526" fill="#ece0c4" stroke="${INK}" stroke-width="2"/><rect x="12" y="12" width="596" height="526" fill="url(#hatchFine)" opacity=".06"/>`;
    s += `<text x="310" y="52" text-anchor="middle" class="type" font-size="20" fill="${INK}">STITCH-CHART — FOR HAIR EMBROIDERY</text>`;
    CIPHER.forEach((ch, i) => {
      const c = i % 4, r = Math.floor(i / 4), x = 30 + c * 145, y = 72 + r * 144;
      s += `<rect x="${x}" y="${y}" width="130" height="130" fill="none" stroke="${INK}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
      s += glyph(ch, x + 25, y + 8, 80, HAIR);
      s += `<text x="${x + 65}" y="${y + 124}" text-anchor="middle" class="type" font-size="22" fill="${BLOOD}">${ch}</text>`;
    });
    s += `<text x="310" y="524" text-anchor="middle" class="scrawl" font-size="13" fill="${INK}" opacity=".7">mind which way the hair turns</text>`;
    s += `</svg>`;
    return s;
  }

  function mirrorSVG(lit) {
    let s = `<svg viewBox="0 0 520 600" class="closeup">`;
    s += `<rect width="520" height="600" fill="#140c0a"/><ellipse cx="260" cy="300" rx="236" ry="284" fill="#6e4a26" stroke="${INK}" stroke-width="4"/><ellipse cx="260" cy="300" rx="208" ry="256" fill="url(#glass)" stroke="${INK}" stroke-width="3"/>`;
    if (lit) {
      s += `<g opacity=".55"><path d="M170 600 Q180 420 260 400 Q340 420 350 600Z" fill="#3a2a30"/><ellipse cx="268" cy="360" rx="58" ry="74" fill="#cdbca3"/><path d="M206 350 Q210 270 268 268 Q326 270 330 350 Q318 300 268 300 Q218 300 206 350Z" fill="${HAIR}"/><ellipse cx="246" cy="356" rx="12" ry="8" fill="#fff"/><ellipse cx="290" cy="356" rx="12" ry="8" fill="#fff"/><circle cx="246" cy="356" r="2" fill="${INK}"/><circle cx="290" cy="356" r="2" fill="${INK}"/><path d="M234 392 Q268 424 302 392 Q268 404 234 392Z" fill="#2a080d"/></g>`;
      s += `<path d="M0 0 L520 0" stroke="none"/>`;
      s += `<ellipse cx="260" cy="206" rx="196" ry="62" fill="#d8ccb4" opacity=".62" filter="url(#blur12)"/>`;
      ['S', 'I', 'S', 'T', 'E', 'R'].forEach((ch, i) => (s += glyph(ch, 70 + i * 64, 176, 60, '#0a0608')));
      s += hair(80, 150, 360, 26, 18, 88, { sway: 20, end: 30, color: '#0a0608', w: 0.6 });
      s += `<ellipse cx="260" cy="300" rx="208" ry="256" fill="url(#candleGlow)" opacity=".25"/>`;
    }
    s += `<path d="M120 140 Q150 90 200 100" stroke="#fff" stroke-width="3" fill="none" opacity=".18"/></svg>`;
    return s;
  }

  function ringsSVG(v) {
    let s = `<svg viewBox="0 0 320 320" class="closeup rings">`;
    s += `<rect width="320" height="320" fill="#1a100c"/>`;
    const radii = [150, 112, 76, 40];
    radii.forEach((r, i) => {
      s += `<circle cx="160" cy="160" r="${r}" fill="${i % 2 ? '#3a2418' : '#4a2e1e'}" stroke="${BRASS}" stroke-width="4"/><circle cx="160" cy="160" r="${r}" fill="url(#hatch)" opacity=".2"/>`;
    });
    s += `<path d="${spiral(160, 160, 6, 148, true, 300)}" stroke="${INK}" stroke-width="1" fill="none" opacity=".45"/>`;
    const mids = [131, 94, 58, 0];
    v.forEach((d, i) => {
      const y = 160 - mids[i] + (i === 3 ? 0 : 0);
      s += `<text x="160" y="${y + 9}" text-anchor="middle" class="roman" font-size="${i === 3 ? 34 : 26}" fill="#f2d68a">${d}</text>`;
    });
    s += `<path d="M160 4 L152 18 L168 18Z" fill="${BLOOD}"/></svg>`;
    return s;
  }

  /* ---------- inventory icons ---------- */
  const ICON = {
    scissors: `<svg viewBox="0 0 60 60"><circle cx="18" cy="44" r="8" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="40" cy="46" r="8" fill="none" stroke="${INK}" stroke-width="3"/><path d="M22 38 L46 8 M36 40 L24 6" stroke="#8a8a8a" stroke-width="4" stroke-linecap="round"/><path d="M10 10 q20 10 40 0" stroke="${HAIR}" stroke-width="1" fill="none"/></svg>`,
    watch: `<svg viewBox="0 0 60 60"><circle cx="30" cy="32" r="20" fill="url(#brass)" stroke="${INK}" stroke-width="2.5"/><circle cx="30" cy="32" r="15" fill="${BONE}"/><line x1="30" y1="32" x2="20" y2="38" stroke="${INK}" stroke-width="2.5"/><line x1="30" y1="32" x2="30" y2="20" stroke="${INK}" stroke-width="1.5"/><circle cx="30" cy="9" r="4" fill="none" stroke="${BRASS}" stroke-width="2.5"/></svg>`,
    cipher: `<svg viewBox="0 0 60 60"><rect x="12" y="6" width="36" height="48" fill="#ece0c4" stroke="${INK}" stroke-width="2" transform="rotate(-6 30 30)"/><path d="${spiral(24, 22, 2, 7, true, 40)}" stroke="${INK}" fill="none" stroke-width="1.5"/><path d="M34 16 v12 M20 40 q4 -4 8 0 t8 0" stroke="${INK}" fill="none" stroke-width="1.5"/></svg>`,
    tongue: `<svg viewBox="0 0 60 60"><path d="M18 10 Q30 4 42 10 L44 36 Q42 54 30 54 Q18 54 16 36Z" fill="#f0d6d0" stroke="${INK}" stroke-width="2.5"/><line x1="30" y1="14" x2="30" y2="40" stroke="#b07070" stroke-width="1.5"/><text x="30" y="34" text-anchor="middle" font-size="9" fill="${INK}" class="type">7·4</text></svg>`,
    candle: `<svg viewBox="0 0 60 60"><rect x="24" y="20" width="12" height="34" fill="${BONE}" stroke="${INK}" stroke-width="2"/><path d="M30 20 v-6" stroke="${INK}" stroke-width="2"/><path d="M24 26 q3 6 0 12" stroke="#c9b9a0" stroke-width="2" fill="none"/></svg>`,
    candleLit: `<svg viewBox="0 0 60 60"><circle cx="30" cy="14" r="14" fill="url(#candleGlow)"/><rect x="24" y="20" width="12" height="34" fill="${BONE}" stroke="${INK}" stroke-width="2"/><path d="M30 4 Q37 13 30 20 Q23 13 30 4Z" fill="#ffd36b" stroke="#e07a1a" stroke-width="1.5"/></svg>`,
    matches: `<svg viewBox="0 0 60 60"><rect x="10" y="22" width="40" height="26" fill="#a33a2a" stroke="${INK}" stroke-width="2"/><rect x="10" y="22" width="40" height="8" fill="#e9dcc0" stroke="${INK}" stroke-width="2"/><circle cx="30" cy="38" r="5" fill="none" stroke="${INK}" stroke-width="1.5"/><path d="M38 20 L52 6" stroke="#d9c18a" stroke-width="3"/><circle cx="52" cy="6" r="3" fill="#7a1a1a"/></svg>`,
    locket: `<svg viewBox="0 0 60 60"><path d="M30 2 L30 14" stroke="${BRASS}" stroke-width="2"/><ellipse cx="30" cy="34" rx="16" ry="20" fill="url(#brass)" stroke="${INK}" stroke-width="2.5"/><path d="${spiral(30, 34, 2, 9, true, 40)}" stroke="${INK}" fill="none" stroke-width="1.3"/></svg>`,
  };

  function tongueSVG() {
    return `<svg viewBox="0 0 400 320" class="closeup"><rect width="400" height="320" fill="#1e1416"/><path d="M130 40 Q200 14 270 40 L282 190 Q276 296 200 296 Q124 296 118 190Z" fill="#efd3cc" stroke="${INK}" stroke-width="4"/><path d="M130 40 Q124 120 128 200 Q134 270 170 290 Q132 240 140 120Z" fill="url(#hatch)" opacity=".4"/><line x1="200" y1="56" x2="200" y2="240" stroke="#a76a6a" stroke-width="3"/><path d="M150 60 l-6 12 M240 80 l8 10 M170 250 l-10 8" stroke="${INK}" stroke-width="1.2"/><text x="200" y="176" text-anchor="middle" class="roman" font-size="62" fill="#4a1218">7 · 4</text></svg>`;
  }
  function locketSVG() {
    let s = `<svg viewBox="0 0 480 320" class="closeup"><rect width="480" height="320" fill="#1e1416"/>`;
    s += `<ellipse cx="140" cy="168" rx="110" ry="134" fill="url(#brass)" stroke="${INK}" stroke-width="4"/><ellipse cx="140" cy="168" rx="92" ry="114" fill="#d8c8a8" stroke="${INK}" stroke-width="2"/>`;
    s += `<g transform="translate(70 90) scale(.46)">${face({ hair: 'long', seed: 7 }).replace(/<svg[^>]*>|<\/svg>/g, '')}</g>`;
    s += `<g transform="translate(140 96) scale(.4)">${face({ hair: 'bob', seed: 9, ribbon: '#c0202a' }).replace(/<svg[^>]*>|<\/svg>/g, '')}</g>`;
    s += `<path d="M84 150 l50 6 l-44 10 l52 8 l-46 12 l40 6" stroke="${INK}" stroke-width="3" fill="none"/>`;
    s += `<ellipse cx="340" cy="168" rx="110" ry="134" fill="url(#brass)" stroke="${INK}" stroke-width="4"/><ellipse cx="340" cy="168" rx="92" ry="114" fill="#b8954f" stroke="${INK}" stroke-width="2"/>`;
    s += `<path d="${spiral(340, 168, 4, 80, true, 200)}" stroke="#7a5a26" stroke-width="1.4" fill="none" opacity=".5"/>`;
    s += `<text x="340" y="190" text-anchor="middle" class="roman" font-size="58" fill="#3a1a10">2 · 9</text></svg>`;
    return s;
  }

  function titleArt() {
    let s = `<svg viewBox="0 0 600 600" class="title-art" aria-hidden="true">`;
    s += `<path d="${spiral(300, 300, 9, 300, true, 900)}" stroke="#7a1820" stroke-width="2.2" fill="none" opacity=".8" class="title-spiral"/>`;
    s += `<g transform="translate(150 110) scale(1)">${face({ hair: 'long', spiral: true, seed: 12, blood: true, dress: '#2c2236' }).replace(/<svg[^>]*>|<\/svg>/g, '')}</g>`;
    s += hair(0, 0, 600, 260, 140, 99, { sway: 60, end: 80, w: 1.6 });
    s += `</svg>`;
    return s;
  }

  function creepSVG() {
    return `<svg viewBox="0 0 1200 700" preserveAspectRatio="none" aria-hidden="true">
      <path id="creepSpiral" pathLength="1" d="${spiral(600, 330, 7, 640, true, 700)}" fill="none" stroke="#5a0d14" stroke-width="5" stroke-linecap="round"/>
      <g id="creepHair">${hair(0, -10, 1200, 260, 120, 7, { sway: 50, end: 60, w: 2 })}</g>
    </svg>`;
  }

  // answers that the artwork itself must agree with
  const ANS_LAMPS = [1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1];

  return {
    defs, spiral, hair, sym, symSVG, SYM_ORDER, glyph, face, ICON, DOLLS,
    sayaRoom, rinRoom, dollsSVG, stairsSVG, watchSVG, clockSVG, wallSVG, cipherSVG, mirrorSVG,
    ringsSVG, tongueSVG, locketSVG, titleArt, creepSVG, ANS_LAMPS, rinWallView,
  };
})();
