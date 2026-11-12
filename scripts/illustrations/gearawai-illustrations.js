/*
 * GEARAWAI — original illustration generator (Phase 6+, image batch 1)
 *
 * Every image is drawn from scratch as vector art in the GEARAWAI palette. No manufacturer photos,
 * product renders, logos or trade dress are used (PRODUCT_DATA §1 rule 6: manufacturer images are
 * copyrighted). Product names appear only as plain text labels, like the original placeholders, and
 * each product image is marked "ILLUSTRATION · ภาพประกอบ" so it is not mistaken for a product photo.
 *
 * How to regenerate: open any page of the running site in a browser, paste this file into the
 * DevTools console, then e.g.  await GAI.toWebp(GAI.product(GAI.PRODUCTS[0]), 800, 800)
 * → a WebP Blob (≤ 2 MB) ready to upload through Admin (Products → รูปภาพ / ImagePicker).
 * Sizes follow SPEC system 16: product 800×800, category 600×600, hero 1920×700 / 1200×600 / 750×1000,
 * promotion 1200×600 / 750×1000, reward 600×600.
 */
(function () {
  const C = {
    bg0: "#0A0B1E",
    bg1: "#12143A",
    surface: "#1A1D4D",
    line: "#2A2F6B",
    primary: "#1F06AC",
    secondary: "#0F42C0",
    accent: "#5882E8",
    lime: "#E3EF4F",
    ink: "#FFFFFF",
    soft: "#C9CDE8",
    muted: "#8B93C9",
  };
  const ACCENTS = ["#5882E8", "#E3EF4F", "#8B7CFF", "#38D5F5"];
  const FONT = "'Segoe UI', Tahoma, Arial, sans-serif";
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let uid = 0;
  const id = (p) => `${p}${++uid}`;

  /* ---------- shared pieces ---------- */
  function defs(a) {
    const g = { glow: id("glow"), body: id("body"), edge: id("edge"), bg: id("bg"), soft: id("soft") };
    const svg = `<defs>
      <radialGradient id="${g.bg}" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="${C.bg1}"/><stop offset="1" stop-color="${C.bg0}"/></radialGradient>
      <linearGradient id="${g.body}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A2E66"/><stop offset=".55" stop-color="#171A44"/><stop offset="1" stop-color="#0D0F2A"/></linearGradient>
      <linearGradient id="${g.edge}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.primary}"/><stop offset=".5" stop-color="${C.secondary}"/><stop offset="1" stop-color="${a}"/></linearGradient>
      <filter id="${g.glow}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
      <filter id="${g.soft}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>`;
    return { svg, g };
  }
  function grid(w, h, step, opacity) {
    let s = "";
    for (let x = step; x < w; x += step) s += `<line x1="${x}" y1="0" x2="${x}" y2="${h}"/>`;
    for (let y = step; y < h; y += step) s += `<line x1="0" y1="${y}" x2="${w}" y2="${y}"/>`;
    return `<g stroke="${C.line}" stroke-width="1" opacity="${opacity}">${s}</g>`;
  }
  /** Up to 2 balanced lines — never leaves a lone short word (e.g. "7") on the second line. */
  function wrap(text, max) {
    const words = String(text).split(" ");
    if (String(text).length <= max) return [String(text)];
    let best = null;
    for (let k = 1; k < words.length; k++) {
      const a = words.slice(0, k).join(" "),
        b = words.slice(k).join(" ");
      if (a.length > max || b.length > max) continue;
      const score = Math.abs(a.length - b.length);
      if (!best || score < best.score) best = { score, lines: [a, b] };
    }
    return best ? best.lines : [String(text)];
  }

  /* ---------- object art (drawn around 0,0; ~±300 wide) ---------- */
  const art = {
    mouse(a, g, v = 0) {
      const body =
        "M0,-200 C112,-200 142,-78 142,42 C142,152 92,202 0,202 C-92,202 -142,152 -142,42 C-142,-78 -112,-200 0,-200 Z";
      return `<g transform="rotate(${v % 2 ? -12 : 10})">
        <ellipse cx="0" cy="40" rx="150" ry="215" fill="${a}" opacity=".35" filter="url(#${g.glow})"/>
        <path d="${body}" fill="url(#${g.body})" stroke="url(#${g.edge})" stroke-width="5"/>
        <path d="M0,-200 L0,-58" stroke="${C.line}" stroke-width="4"/>
        <path d="M-142,-34 Q0,-6 142,-34" fill="none" stroke="${C.line}" stroke-width="4"/>
        <rect x="-11" y="-158" width="22" height="58" rx="11" fill="${C.bg0}" stroke="${a}" stroke-width="3"/>
        <path d="M-138,-10 Q-150,40 -132,96" stroke="${a}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".9"/>
        ${v % 3 === 1 ? `<rect x="-150" y="-60" width="10" height="34" rx="5" fill="${C.soft}"/><rect x="-150" y="-18" width="10" height="34" rx="5" fill="${C.soft}"/>` : ""}
        <circle cx="0" cy="96" r="22" fill="${C.bg0}" stroke="${a}" stroke-width="4"/>
        <circle cx="0" cy="96" r="8" fill="${a}"/>
        <path d="M-96,170 Q0,214 96,170" stroke="${a}" stroke-width="4" fill="none" opacity=".7"/>
      </g>`;
    },
    /** opts.rgb — every key lit in a diagonal wave of the brand colours (promotion banner) */
    keyboard(a, g, v = 0, opts = {}) {
      const RGB = [C.primary, C.secondary, C.accent, "#8B7CFF", "#38D5F5", C.lime];
      const cols = v % 2 ? 12 : 15;
      const w = v % 2 ? 480 : 600;
      const kw = (w - 40) / cols - 6;
      let keys = "";
      for (let r = 0; r < 5; r++)
        for (let c = 0; c < cols; c++) {
          if (r === 4 && c > 2 && c < cols - 3) {
            if (c === 3)
              keys += `<rect x="${-w / 2 + 20 + c * (kw + 6)}" y="${-90 + r * 40}" width="${(kw + 6) * (cols - 6) - 6}" height="32" rx="6" fill="#20245A" stroke="${a}" stroke-opacity=".5"/>`;
            continue;
          }
          const hue = opts.rgb
            ? RGB[Math.floor((c + r) / 2) % RGB.length]
            : (r + c) % 7 === 0
              ? a
              : "#20245A";
          const op = opts.rgb ? 0.8 : hue === a ? 0.85 : 1;
          keys += `<rect x="${-w / 2 + 20 + c * (kw + 6)}" y="${-90 + r * 40}" width="${kw}" height="32" rx="6" fill="${hue}" fill-opacity="${op}" stroke="${C.line}"/>`;
        }
      return `<g transform="rotate(-9) skewX(-8)">
        <ellipse cx="0" cy="40" rx="${w / 2 + 30}" ry="130" fill="${a}" opacity=".32" filter="url(#${g.glow})"/>
        <rect x="${-w / 2}" y="-110" width="${w}" height="230" rx="24" fill="url(#${g.body})" stroke="url(#${g.edge})" stroke-width="5"/>
        ${keys}
        <rect x="${-w / 2 + 8}" y="112" width="${w - 16}" height="6" rx="3" fill="${a}" opacity=".85"/>
      </g>`;
    },
    headset(a, g, v = 0) {
      return `<g>
        <ellipse cx="0" cy="190" rx="220" ry="34" fill="${a}" opacity=".2" filter="url(#${g.glow})"/>
        <path d="M-160,60 C-170,-190 170,-190 160,60" fill="none" stroke="${a}" stroke-width="30" opacity=".22" filter="url(#${g.soft})"/>
        <path d="M-160,60 C-170,-190 170,-190 160,60" fill="none" stroke="#1A1D4D" stroke-width="40" stroke-linecap="round"/>
        <path d="M-160,60 C-170,-190 170,-190 160,60" fill="none" stroke="url(#${g.edge})" stroke-width="8" stroke-linecap="round"/>
        <path d="M-118,-92 C-60,-150 60,-150 118,-92" fill="none" stroke="${C.soft}" stroke-width="6" opacity=".35" stroke-linecap="round"/>
        <rect x="-222" y="10" width="92" height="170" rx="40" fill="url(#${g.body})" stroke="url(#${g.edge})" stroke-width="5"/>
        <rect x="130" y="10" width="92" height="170" rx="40" fill="url(#${g.body})" stroke="url(#${g.edge})" stroke-width="5"/>
        <ellipse cx="-176" cy="95" rx="26" ry="52" fill="none" stroke="${a}" stroke-width="5"/>
        <ellipse cx="176" cy="95" rx="26" ry="52" fill="none" stroke="${a}" stroke-width="5"/>
        ${v % 2 === 0 ? `<path d="M-176,170 Q-150,252 -40,240" fill="none" stroke="#2A2E66" stroke-width="12" stroke-linecap="round"/><circle cx="-34" cy="240" r="15" fill="${a}"/>` : ""}
      </g>`;
    },
    mousepad(a, g) {
      return `<g>
        <ellipse cx="0" cy="20" rx="330" ry="130" fill="${a}" opacity=".35" filter="url(#${g.glow})"/>
        <polygon points="-330,110 330,110 260,-90 -260,-90" fill="url(#${g.body})" stroke="url(#${g.edge})" stroke-width="7" stroke-linejoin="round"/>
        <polygon points="-310,100 310,100 248,-80 -248,-80" fill="none" stroke="${a}" stroke-width="3" opacity=".8"/>
        <path d="M-200,40 C-80,-60 60,80 200,-30" fill="none" stroke="${C.line}" stroke-width="5" opacity=".9"/>
        <text x="0" y="66" text-anchor="middle" font-family="${FONT}" font-size="26" font-weight="700" letter-spacing="10" fill="${C.soft}" opacity=".35">GEARAWAI</text>
      </g>`;
    },
    chair(a, g, v = 0) {
      return `<g transform="translate(0,28) scale(.9)">
        <ellipse cx="0" cy="235" rx="210" ry="50" fill="${a}" opacity=".45" filter="url(#${g.glow})"/>
        <path d="M-96,-240 Q0,-272 96,-240 L118,-56 Q122,-6 84,14 L-84,14 Q-122,-6 -118,-56 Z" fill="none" stroke="${a}" stroke-width="22" opacity=".2" filter="url(#${g.soft})"/>
        <path d="M-96,-240 Q0,-272 96,-240 L118,-56 Q122,-6 84,14 L-84,14 Q-122,-6 -118,-56 Z" fill="url(#${g.body})" stroke="url(#${g.edge})" stroke-width="5"/>
        <path d="M-60,-220 L-70,-30 M60,-220 L70,-30" stroke="${a}" stroke-width="6" stroke-linecap="round" opacity=".85"/>
        <rect x="-52" y="-212" width="104" height="44" rx="20" fill="#20245A" stroke="${C.line}" stroke-width="3"/>
        <rect x="-130" y="20" width="260" height="64" rx="26" fill="url(#${g.body})" stroke="url(#${g.edge})" stroke-width="5"/>
        <path d="M-150,-10 L-150,60 M150,-10 L150,60" stroke="${C.soft}" stroke-width="10" stroke-linecap="round" opacity=".6"/>
        <rect x="-12" y="84" width="24" height="86" rx="6" fill="#2A2E66"/>
        <g stroke="${C.soft}" stroke-width="9" stroke-linecap="round" opacity=".75">
          <path d="M0,172 L-150,206"/><path d="M0,172 L150,206"/><path d="M0,172 L-80,226"/><path d="M0,172 L80,226"/><path d="M0,172 L0,236"/>
        </g>
        <g fill="${C.bg0}" stroke="${a}" stroke-width="4">
          <circle cx="-150" cy="214" r="12"/><circle cx="150" cy="214" r="12"/><circle cx="-80" cy="234" r="12"/><circle cx="80" cy="234" r="12"/><circle cx="0" cy="244" r="12"/>
        </g>
        ${v % 2 ? `<rect x="-118" y="-150" width="236" height="10" rx="5" fill="${a}" opacity=".5"/>` : ""}
      </g>`;
    },
    wheel(a, g) {
      return `<g>
        <ellipse cx="0" cy="225" rx="230" ry="50" fill="${a}" opacity=".45" filter="url(#${g.glow})"/>
        <circle cx="0" cy="-10" r="175" fill="none" stroke="${a}" stroke-width="34" opacity=".25" filter="url(#${g.soft})"/>
        <rect x="-150" y="150" width="300" height="70" rx="22" fill="url(#${g.body})" stroke="url(#${g.edge})" stroke-width="5"/>
        <circle cx="0" cy="-10" r="175" fill="none" stroke="#1A1D4D" stroke-width="44"/>
        <circle cx="0" cy="-10" r="175" fill="none" stroke="url(#${g.edge})" stroke-width="8"/>
        <path d="M-150,-10 L-55,-10 M55,-10 L150,-10 M0,45 L0,150" stroke="#2A2E66" stroke-width="34" stroke-linecap="round"/>
        <circle cx="0" cy="-10" r="62" fill="url(#${g.body})" stroke="${a}" stroke-width="5"/>
        <circle cx="-26" cy="-22" r="9" fill="${a}"/><circle cx="26" cy="-22" r="9" fill="${C.lime}"/><circle cx="0" cy="14" r="9" fill="${C.soft}"/>
        <rect x="-8" y="-198" width="16" height="30" rx="6" fill="${C.lime}"/>
      </g>`;
    },
    streamdeck(a, g) {
      let keys = "";
      const icons = [
        "M-10,-10 L12,0 L-10,10 Z",
        "M-11,-11 h22 v22 h-22 Z",
        "M0,-12 A12,12 0 1 1 -0.1,-12 Z",
        "M-12,6 L0,-10 L12,6 Z",
      ];
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 5; c++) {
          const x = -168 + c * 84,
            y = -110 + r * 80;
          const col = ACCENTS[(r * 5 + c) % ACCENTS.length];
          keys += `<rect x="${x - 30}" y="${y - 30}" width="60" height="60" rx="12" fill="#0F1130" stroke="${col}" stroke-width="3"/>
            <path d="${icons[(r + c) % icons.length]}" transform="translate(${x},${y})" fill="${col}" opacity=".9"/>`;
        }
      return `<g transform="rotate(-6)">
        <ellipse cx="0" cy="20" rx="270" ry="190" fill="${a}" opacity=".3" filter="url(#${g.glow})"/>
        <path d="M-90,130 L-130,220 L130,220 L90,130 Z" fill="#20245A" stroke="${C.line}" stroke-width="4"/>
        <rect x="-224" y="-160" width="448" height="290" rx="30" fill="url(#${g.body})" stroke="url(#${g.edge})" stroke-width="5"/>
        ${keys}
      </g>`;
    },
    hub(a, g) {
      let ports = "";
      for (let i = 0; i < 4; i++)
        ports += `<rect x="${-150 + i * 80}" y="-14" width="52" height="22" rx="4" fill="${C.bg0}" stroke="${a}" stroke-width="3"/>`;
      return `<g transform="rotate(-8)">
        <ellipse cx="0" cy="10" rx="260" ry="120" fill="${a}" opacity=".3" filter="url(#${g.glow})"/>
        <rect x="-200" y="-60" width="400" height="110" rx="26" fill="url(#${g.body})" stroke="url(#${g.edge})" stroke-width="5"/>
        ${ports}
        <path d="M200,-5 C290,-5 300,120 220,170" fill="none" stroke="#2A2E66" stroke-width="16" stroke-linecap="round"/>
        <rect x="196" y="160" width="46" height="30" rx="6" fill="${C.soft}" transform="rotate(24 219 175)"/>
      </g>`;
    },
  };
  const TYPE = {
    MS: "mouse",
    KB: "keyboard",
    HS: "headset",
    MP: "mousepad",
    CH: "chair",
    RW: "wheel",
    ST: "streamdeck",
    AC: "hub",
  };

  /* ---------- compositions ---------- */
  function frame(w, h, a, inner, d) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${d.svg}
      <rect width="${w}" height="${h}" fill="url(#${d.g.bg})"/>
      ${grid(w, h, Math.round(Math.min(w, h) / 10), 0.35)}
      ${inner}
      <rect x="18" y="18" width="${w - 36}" height="${h - 36}" rx="${Math.round(Math.min(w, h) / 25)}" fill="none" stroke="url(#${d.g.edge})" stroke-width="3" opacity=".9"/>
    </svg>`;
  }

  /** Product image 800×800 — {sku, name, brand} */
  function product(p, i = 0) {
    const kind = TYPE[p.sku.split("-")[1]] ?? "hub";
    const a = ACCENTS[i % ACCENTS.length];
    const d = defs(a);
    const lines = wrap(p.name, 24);
    const ny = lines.length > 1 ? 616 : 640;
    const text = `
      <text x="400" y="104" text-anchor="middle" font-family="${FONT}" font-size="26" font-weight="700" letter-spacing="8" fill="${a}">${esc(p.brand.toUpperCase())}</text>
      ${lines.map((l, k) => `<text x="400" y="${ny + k * 50}" text-anchor="middle" font-family="${FONT}" font-size="44" font-weight="800" fill="${C.ink}">${esc(l)}</text>`).join("")}
      <text x="400" y="742" text-anchor="middle" font-family="${FONT}" font-size="19" letter-spacing="3" fill="${C.muted}">${esc(p.sku)} · ILLUSTRATION · ภาพประกอบ</text>`;
    return frame(
      800,
      800,
      a,
      `<g transform="translate(400,350) scale(0.82)">${art[kind](a, d.g, i)}</g>${text}`,
      d,
    );
  }

  /** Category image 600×600 — {name, kind} */
  function category(c, i = 0) {
    const a = ACCENTS[i % ACCENTS.length];
    const d = defs(a);
    // No label: the category card prints the name under the image (it would be ~10px at 144px anyway).
    return frame(
      600,
      600,
      a,
      `<g transform="translate(300,300) scale(0.8)">${art[c.kind](a, d.g, i)}</g>`,
      d,
    );
  }

  /** Hero background (no text — the page overlays its own heading and CTA). */
  function hero(w, h) {
    const a = C.accent;
    const d = defs(a);
    const portrait = h > w;
    const s = portrait ? w / 900 : h / 760;
    const place = (x, y, sc, inner) => `<g transform="translate(${x},${y}) scale(${sc})">${inner}</g>`;
    let floor = "";
    const cx = w / 2,
      hy = h * 0.62;
    for (let i = -12; i <= 12; i++)
      floor += `<line x1="${cx + i * 40}" y1="${hy}" x2="${cx + i * 260}" y2="${h}"/>`;
    for (let k = 1; k < 8; k++) {
      const y = hy + (h - hy) * (k / 8) ** 1.6;
      floor += `<line x1="0" y1="${y}" x2="${w}" y2="${y}"/>`;
    }
    const items = portrait
      ? place(w * 0.5, h * 0.8, s * 1.15, art.keyboard(a, d.g)) +
        place(w * 0.27, h * 0.58, s * 0.85, art.headset(C.lime, d.g, 0)) +
        place(w * 0.76, h * 0.6, s * 0.75, art.mouse("#8B7CFF", d.g, 1))
      : place(w - h * 0.95, h * 0.68, s * 1.2, art.keyboard(a, d.g)) +
        place(w - h * 0.28, h * 0.56, s * 0.85, art.mouse("#8B7CFF", d.g, 1)) +
        place(w - h * 1.2, h * 0.3, s * 0.8, art.headset(C.lime, d.g, 0));
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${d.svg}
      <linearGradient id="hz" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.primary}"/><stop offset=".5" stop-color="${C.bg1}"/><stop offset="1" stop-color="${C.bg0}"/></linearGradient>
      <rect width="${w}" height="${h}" fill="url(#hz)"/>
      <g stroke="${C.accent}" stroke-width="1.5" opacity=".28">${floor}</g>
      <circle cx="${portrait ? w * 0.6 : w - h * 0.7}" cy="${portrait ? h * 0.6 : h * 0.35}" r="${Math.min(w, h) * 0.32}" fill="none" stroke="${C.accent}" stroke-width="2" opacity=".35"/>
      <circle cx="${portrait ? w * 0.6 : w - h * 0.7}" cy="${portrait ? h * 0.6 : h * 0.35}" r="${Math.min(w, h) * 0.22}" fill="none" stroke="${C.lime}" stroke-width="2" opacity=".25"/>
      ${items}
    </svg>`;
  }

  /**
   * Promotion banner background — one campaign look (same background, grid, % marks, lime accent,
   * placement); only the product changes. kind: "headset" (Headset Week, default) | "mouse" | "keyboard".
   * No text: the promotion card overlays its own name, discount badge and dates.
   */
  const PROMO_ART = {
    headset: { size: 1, draw: (a, g) => art.headset(a, g, 0) },
    mouse: { size: 1.05, draw: (a, g) => art.mouse(a, g, 0) },
    // the keyboard is wider than it is tall: smaller in portrait so it stays inside the 750px frame
    keyboard: {
      size: 0.9,
      portraitSize: 0.88,
      x: 0.64,
      draw: (a, g) => art.keyboard(a, g, 0, { rgb: true }),
    },
  };
  function promo(w, h, kind = "headset") {
    const a = C.lime;
    const d = defs(a);
    const portrait = h > w;
    const P = PROMO_ART[kind] ?? PROMO_ART.headset;
    const sc = (portrait ? w / 680 : h / 620) * (portrait ? (P.portraitSize ?? P.size) : P.size);
    let tags = "";
    for (let i = 0; i < 9; i++) {
      const x = (portrait ? 0.15 : 0.08) * w + (((i * 137) % 100) / 100) * w * 0.84;
      const y = (((i * 71) % 100) / 100) * h * 0.9 + h * 0.05;
      tags += `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${28 + (i % 3) * 14}" font-weight="800" fill="${i % 2 ? C.accent : C.lime}" opacity=".22">%</text>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${d.svg}
      <rect width="${w}" height="${h}" fill="url(#${d.g.bg})"/>
      ${grid(w, h, Math.round(Math.min(w, h) / 8), 0.3)}${tags}
      <g transform="translate(${portrait ? w * 0.5 : w * (P.x ?? 0.7)},${portrait ? h * 0.56 : h * 0.47}) scale(${sc})">${P.draw(a, d.g)}</g>
    </svg>`;
  }

  /** Reward image 600×600 — kind: mug | pad | sticker | keychain */
  function reward(kind, name, i = 0) {
    const a = ACCENTS[i % ACCENTS.length];
    const d = defs(a);
    const brand = `font-family="${FONT}" font-weight="800" letter-spacing="4"`;
    const obj = {
      mug: `<ellipse cx="0" cy="40" rx="180" ry="170" fill="${a}" opacity=".3" filter="url(#${d.g.glow})"/>
        <path d="M120,-60 C210,-60 210,90 120,90" fill="none" stroke="#2A2E66" stroke-width="30"/>
        <path d="M-130,-130 L130,-130 L115,150 Q0,175 -115,150 Z" fill="url(#${d.g.body})" stroke="url(#${d.g.edge})" stroke-width="5"/>
        <ellipse cx="0" cy="-130" rx="130" ry="22" fill="#0D0F2A" stroke="${a}" stroke-width="4"/>
        <text x="0" y="20" text-anchor="middle" ${brand} font-size="30" fill="${C.ink}">GEAR<tspan fill="${C.lime}">AWAI</tspan></text>`,
      pad: art.mousepad(a, d.g),
      sticker: `<ellipse cx="0" cy="0" rx="210" ry="170" fill="${a}" opacity=".3" filter="url(#${d.g.glow})"/>
        <path d="M-200,-110 Q-200,-130 -180,-130 L180,-130 Q200,-130 200,-110 L200,70 L140,130 L-180,130 Q-200,130 -200,110 Z" fill="${C.ink}"/>
        <path d="M200,70 L140,130 L150,80 Z" fill="${C.soft}"/>
        <rect x="-180" y="-110" width="350" height="220" rx="16" fill="url(#${d.g.edge})"/>
        <text x="-5" y="-5" text-anchor="middle" ${brand} font-size="46" fill="${C.ink}">GEAR<tspan fill="${C.lime}">AWAI</tspan></text>
        <text x="-5" y="45" text-anchor="middle" font-family="${FONT}" font-size="20" letter-spacing="6" fill="${C.soft}">LEVEL UP YOUR GEAR</text>`,
      keychain: `<ellipse cx="0" cy="40" rx="170" ry="200" fill="${a}" opacity=".3" filter="url(#${d.g.glow})"/>
        <circle cx="0" cy="-150" r="54" fill="none" stroke="${C.soft}" stroke-width="10"/>
        <rect x="-10" y="-104" width="20" height="40" rx="6" fill="${C.soft}"/>
        <rect x="-110" y="-66" width="220" height="250" rx="40" fill="url(#${d.g.body})" stroke="url(#${d.g.edge})" stroke-width="5"/>
        <text x="0" y="80" text-anchor="middle" ${brand} font-size="96" fill="${a}">G</text>
        <text x="0" y="150" text-anchor="middle" ${brand} font-size="22" fill="${C.soft}">GEARAWAI</text>`,
    }[kind];
    // No label: the reward card prints the reward name (`name` kept in the signature for callers).
    void name;
    return frame(600, 600, a, `<g transform="translate(300,300) scale(0.95)">${obj}</g>`, d);
  }

  /** Rasterise an SVG string to a WebP Blob (Chromium canvas). */
  async function toWebp(svg, w, h, quality = 0.9) {
    const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    await img.decode();
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d").drawImage(img, 0, 0, w, h);
    return new Promise((r) => c.toBlob(r, "image/webp", quality));
  }

  const PRODUCTS = [
    ["GA-MS-001", "Razer DeathAdder V3 Pro", "Razer"],
    ["GA-MS-002", "Logitech G Pro X Superlight 2", "Logitech"],
    ["GA-MS-003", "Logitech G502 X Plus", "Logitech"],
    ["GA-MS-004", "Razer Viper V3 Pro", "Razer"],
    ["GA-MS-005", "SteelSeries Aerox 3 Wireless", "SteelSeries"],
    ["GA-KB-001", "Razer BlackWidow V4", "Razer"],
    ["GA-KB-002", "Logitech G Pro X TKL", "Logitech"],
    ["GA-KB-003", "HyperX Alloy Origins", "HyperX"],
    ["GA-KB-004", "SteelSeries Apex Pro TKL", "SteelSeries"],
    ["GA-KB-005", "Keychron K8 Pro", "Keychron"],
    ["GA-HS-001", "Logitech G733 Lightspeed", "Logitech"],
    ["GA-HS-002", "Razer BlackShark V2 Pro", "Razer"],
    ["GA-HS-003", "SteelSeries Arctis Nova 7", "SteelSeries"],
    ["GA-HS-004", "HyperX Cloud III", "HyperX"],
    ["GA-HS-005", "Logitech G Pro X 2 Lightspeed", "Logitech"],
    ["GA-MP-001", "Razer Strider Chroma", "Razer"],
    ["GA-CH-001", "Razer Iskur V2", "Razer"],
    ["GA-CH-002", "Secretlab TITAN Evo", "Secretlab"],
    ["GA-RW-001", "Logitech G923 Racing Wheel", "Logitech"],
    ["GA-ST-001", "Elgato Stream Deck MK.2", "Elgato"],
  ].map(([sku, name, brand]) => ({ sku, name, brand }));
  const CATEGORIES = [
    ["gaming-mouse", "Gaming Mouse", "mouse"],
    ["gaming-keyboard", "Gaming Keyboard", "keyboard"],
    ["gaming-headset", "Gaming Headset", "headset"],
    ["mouse-pad", "Mouse Pad", "mousepad"],
    ["gaming-chair", "Gaming Chair", "chair"],
    ["racing-wheel", "Racing Wheel", "wheel"],
    ["streaming-equipment", "Streaming Equipment", "streamdeck"],
    ["computer-accessories", "Computer Accessories", "hub"],
  ].map(([slug, name, kind]) => ({ slug, name, kind }));
  const REWARDS = [
    ["แก้วน้ำ", "mug", "แก้วน้ำ GEARAWAI"],
    ["แผ่นรองเมาส์", "pad", "แผ่นรองเมาส์ GEARAWAI"],
    ["สติกเกอร์", "sticker", "สติกเกอร์ GEARAWAI"],
    ["พวงกุญแจ", "keychain", "พวงกุญแจ GEARAWAI"],
  ].map(([match, kind, label]) => ({ match, kind, label }));

  window.GAI = { product, category, hero, promo, reward, toWebp, PRODUCTS, CATEGORIES, REWARDS };
})();
