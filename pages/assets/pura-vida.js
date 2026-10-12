/*!
 * pura-vida: an animated ASCII beach in Costa Rica, for a web page.
 *
 *   <script src="pura-vida.js" defer></script>
 *   <pura-vida></pura-vida>
 *
 * Sunset over a turquoise bay. A volcano erupts across the water: lava bombs arc
 * out of the crater, an ash column climbs into the clouds, lightning flickers in
 * it, and its glow flares on the sea, the palms and the sand. On a driftwood log
 * in the foreground a white-faced capuchin eats a banana and watches the show.
 *
 * No dependencies, no build step, one file. It draws on a <canvas> inside the
 * tag (shadow DOM, so your CSS cannot break it and it cannot break yours).
 *
 * Attributes (all optional)
 *   cols     grid width in characters, 80 to 240 (default 160; rows follow)
 *   fps      frames a second, 1 to 60 (default 20)
 *   fade     "off" to turn off the soft fade into the page at the edges
 *   motion   play even when the visitor prefers reduced motion
 *   seed     any number: different clouds and stars
 *   label    the text a screen reader hears
 * CSS
 *   pura-vida { --pura-bg: #0d1511; --pura-pos: 50% 78%; aspect-ratio: 16 / 10; }
 *   The tag is a block that fills its container. Give it a height or a different
 *   aspect-ratio and the picture is cropped (never stretched); --pura-pos says
 *   which part to keep.
 * JS (on the element)
 *   el.pause()  el.play()  el.advance(seconds)
 *
 * MIT licence. The ASCII halftone approach follows ascii.rest by @bas3line.
 */
(() => {
  "use strict";
  const TAG = "pura-vida";
  if (typeof customElements === "undefined" || customElements.get(TAG)) return;

  // ---- the picture's own units: 160 across, 100 down, whatever the grid ------
  const LW = 160, LH = 100;
  const H0 = 58; // the horizon
  const CU = 116, CV = 27; // the crater
  const SUNP = [44, 56]; // the sun, half sunk in the sea
  const LAVA = [1, 0.38, 0.12]; // the colour of the volcano's light
  const MK = [48, 90]; // where the monkey sits (on top of the log)
  const SIM_HZ = 24;

  // ---- glyphs ----------------------------------------------------------------
  const GLY = " .,'`:;-~=+*xX%#@^|/\\()[]oO0&8!\"_<>iltIf1PURAVD";
  const G = (c) => GLY.indexOf(c);
  const COV = new Float32Array(GLY.length).fill(0.3);
  const covs = { " ": 0, ".": 0.1, ",": 0.14, "'": 0.12, "`": 0.1, ":": 0.2, ";": 0.24, "-": 0.2, "~": 0.24, "=": 0.32, "+": 0.28, "*": 0.36, x: 0.36, X: 0.45, "%": 0.52, "#": 0.62, "@": 0.7, "^": 0.25, "|": 0.22, "/": 0.22, "\\": 0.22, o: 0.4, O: 0.5, 0: 0.55, "&": 0.55, 8: 0.58, "!": 0.2, '"': 0.15, _: 0.12, i: 0.3, l: 0.28, t: 0.35, I: 0.33, f: 0.38, 1: 0.34 };
  for (const c in covs) COV[G(c)] = covs[c];
  const ramp = (s) => Uint8Array.from(s, (c) => G(c));
  const R_SKY = 0, R_FOL = 1, R_GRD = 2, R_OBJ = 3, R_FIX = 4, R_MTN = 5;
  const RAMPS = [ramp(" .,:"), ramp(":;i!lI|fx%#&@"), ramp(" .,':;~=+*"), ramp("=+xX%#@"), ramp(" "), ramp(" .:-=+*x%")];
  const FIRE = ramp(" .:^*x%#@");
  const BGK = [1, 0.42, 0.55, 0.4, 0.4, 0.55]; // how much of a cell's colour fills its background, by kind
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16 - 0.5);

  // 16 levels a channel, finer in the darks: 4096 colours, so a glyph atlas stays small
  const LVL = [0, 5, 10, 16, 23, 31, 40, 51, 64, 80, 100, 125, 155, 190, 225, 255];
  const LVQ = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    let b = 0, bd = 1e9;
    for (let j = 0; j < 16; j++) {
      const d = Math.abs(LVL[j] - i);
      if (d < bd) (bd = d), (b = j);
    }
    LVQ[i] = b;
  }

  // ---- small maths -------------------------------------------------------------
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const smooth = (a, b, v) => {
    const k = clamp((v - a) / (b - a));
    return k * k * (3 - 2 * k);
  };
  const mix = (a, b, k) => a + (b - a) * k;
  function mulberry32(a) {
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, o) {
    let s = 0, n = 0, a = 0.5, f = 1;
    for (let i = 0; i < o; i++) {
      s += a * noise(x * f, y * f);
      n += a;
      a *= 0.5;
      f *= 2;
    }
    return s / n;
  }
  // a colour that runs through stops [[pos, r, g, b], ...]
  const tmp = [0, 0, 0];
  function stops(S, p) {
    let i = 1;
    while (i < S.length - 1 && p > S[i][0]) i++;
    const a = S[i - 1], b = S[i], k = clamp((p - a[0]) / (b[0] - a[0]));
    tmp[0] = mix(a[1], b[1], k), tmp[1] = mix(a[2], b[2], k), tmp[2] = mix(a[3], b[3], k);
    return tmp;
  }

  // heat to colour: black, deep red, orange, yellow, nearly white
  const FSTOPS = [[0, 0.1, 0.02, 0.01], [0.1, 0.45, 0.06, 0.02], [0.25, 0.85, 0.18, 0.03], [0.45, 1, 0.42, 0.06], [0.65, 1, 0.65, 0.15], [0.85, 1, 0.85, 0.4], [1.01, 1, 0.97, 0.75]];
  const fcol = [0, 0, 0];
  function fireColor(h) {
    let i = 1;
    while (i < FSTOPS.length - 1 && h > FSTOPS[i][0]) i++;
    const a = FSTOPS[i - 1], b = FSTOPS[i], k = clamp((h - a[0]) / (b[0] - a[0]));
    fcol[0] = mix(a[1], b[1], k), fcol[1] = mix(a[2], b[2], k), fcol[2] = mix(a[3], b[3], k);
  }

  const SKY = [[0, 0.03, 0.03, 0.12], [16, 0.12, 0.06, 0.22], [32, 0.4, 0.15, 0.3], [46, 0.82, 0.34, 0.28], [H0, 1, 0.64, 0.32]];
  const WATER = [[0, 0.62, 0.32, 0.3], [0.35, 0.2, 0.14, 0.3], [0.75, 0.06, 0.22, 0.3], [1, 0.08, 0.38, 0.38]];

  // ---- the scene, built once per grid size ---------------------------------------
  // Every cell gets an ambient (dusk) colour, the colour it takes at full volcano glow,
  // and the kind of glyph it is drawn with. A frame is then ambient + glow * flicker,
  // with the sea, clouds, ash, lava and the monkey painted on top.
  function build(W, H, seed) {
    const N = W * H, rng = mulberry32(seed);
    const S = {
      W, H, N,
      r0: new Float32Array(N), g0: new Float32Array(N), b0: new Float32Array(N),
      r1: new Float32Array(N), g1: new Float32Array(N), b1: new Float32Array(N),
      ramp: new Uint8Array(N), gl: new Uint8Array(N), emt: new Uint8Array(N), emw: new Float32Array(N), emp: new Float32Array(N),
      hv: new Float32Array(N), bgs: new Float32Array(N), volc: new Uint8Array(N), sea: new Uint8Array(N),
    };
    const sx = W / LW, sy = H / LH;
    const cellsIn = (u0, v0, u1, v1, fn) => {
      const c0 = Math.max(0, Math.floor(u0 * sx)), c1 = Math.min(W - 1, Math.floor(u1 * sx));
      const r0 = Math.max(0, Math.floor(v0 * sy)), r1 = Math.min(H - 1, Math.floor(v1 * sy));
      for (let row = r0; row <= r1; row++) for (let col = c0; col <= c1; col++) fn(col, row, row * W + col, (col + 0.5) / sx, (row + 0.5) / sy);
    };
    // lit by the volcano: `face` is how squarely this cell looks at it, `ds` how far its light carries
    const setC = (k, u, v, rp, amb, lit, face, gain, ds = 46) => {
      const d = Math.hypot(u - CU, v - CV);
      const l = (gain * face * 2.2) / (1 + (d / ds) * (d / ds));
      S.r0[k] = amb[0], S.g0[k] = amb[1], S.b0[k] = amb[2];
      S.r1[k] = lit[0] * LAVA[0] * l, S.g1[k] = lit[1] * LAVA[1] * l, S.b1[k] = lit[2] * LAVA[2] * l;
      S.ramp[k] = rp, S.emt[k] = 0, S.emw[k] = 0, S.sea[k] = 0, S.volc[k] = 0, S.bgs[k] = BGK[rp];
    };
    const paintAt = (u, v, fn) => {
      const col = Math.floor(u * sx), row = Math.floor(v * sy);
      if (col < 0 || col >= W || row < 0 || row >= H) return;
      fn(row * W + col, (col + 0.5) / sx, (row + 0.5) / sy, col, row);
    };

    // ---- sky, with the sun half sunk in the sea --------------------------------
    S.sky = [];
    const sand = [0, 0, 0];
    for (let row = 0; row < H; row++) {
      for (let col = 0; col < W; col++) {
        const k = row * W + col, u = (col + 0.5) / sx, v = (row + 0.5) / sy;
        S.hv[k] = hash(col * 7 + 3, row * 13 + seed);
        if (v < H0) {
          const c = stops(SKY, v);
          let r = c[0], g = c[1], b = c[2];
          const sg = Math.exp(-Math.hypot(u - SUNP[0], (v - SUNP[1]) * 1.2) / 16);
          r += 0.5 * sg, g += 0.3 * sg, b += 0.1 * sg;
          const wide = Math.exp(-Math.abs(u - SUNP[0]) / 55) * smooth(25, H0, v);
          r += 0.12 * wide, g += 0.05 * wide, b += 0.06 * wide;
          setC(k, u, v, R_SKY, [r, g, b], [0, 0, 0], 0, 0);
          const l2 = 1.5 / (1 + (Math.hypot(u - CU, v - CV) / 24) ** 2);
          S.r1[k] = 0.34 * l2, S.g1[k] = 0.11 * l2, S.b1[k] = 0.03 * l2;
          const dsun = Math.hypot(u - SUNP[0], v - SUNP[1]);
          if (dsun <= 6.3) {
            S.ramp[k] = R_FIX, S.gl[k] = G(dsun > 5 ? "%" : "@");
            S.r0[k] = 1, S.g0[k] = 0.8 - 0.2 * (dsun / 6.3), S.b0[k] = 0.42, S.r1[k] = S.g1[k] = S.b1[k] = 0, S.bgs[k] = 0.9;
          } else S.sky.push(k);
        } else {
          // sand; under the water too, so the waves have something to wash over
          const vs = Math.max(v, 80), t = smooth(80, 100, vs);
          sand[0] = mix(0.34, 0.16, t), sand[1] = mix(0.19, 0.105, t), sand[2] = mix(0.17, 0.1, t);
          setC(k, u, v, R_GRD, sand, [0.9, 0.55, 0.35], 1, 0.2, 50);
          S.sea[k] = v < 88 ? 1 : 0;
        }
      }
    }

    // ---- the volcano ----------------------------------------------------------------
    const rivers = [
      { u0: CU - 2.6, dir: -0.55, len: 21, ph: 0.3 },
      { u0: CU + 0.8, dir: 0.3, len: 25, ph: 2.1 },
      { u0: CU + 3.4, dir: 0.85, len: 17, ph: 4.0 },
    ];
    cellsIn(CU - 70, CV - 2, CU + 80, H0 + 1, (col, row, k, u, v) => {
      const t = (v - CV) / (H0 - CV), du = u - CU;
      const wob = (noise(v * 0.3, 7 + seed) - 0.5) * 2.2;
      const hwL = 4.5 + Math.pow(Math.max(t, 0), 1.1) * 38 + wob, hwR = 4.5 + Math.pow(Math.max(t, 0), 1.1) * 44 - wob * 0.7;
      const vtop = Math.abs(du) <= 5 ? CV + 1.8 * (1 - (du / 5) ** 2) : CV;
      if (du < -hwL || du > hwR || v < vtop) return;
      const nx = clamp(du / (du < 0 ? hwL : hwR), -1, 1), sun = clamp(0.5 - 0.6 * nx);
      const tex = 0.65 + 0.7 * fbm(u * 0.3 + v * 0.05, v * 0.45, 3);
      const veg = smooth(0.55, 0.85, t + 0.25 * (noise(u * 0.2, v * 0.3) - 0.5));
      if (veg > 0.5) {
        setC(k, u, v, R_FOL, [mix(0.07, 0.22, sun * 0.6), mix(0.14, 0.2, sun * 0.4), mix(0.12, 0.18, sun * 0.3)], [0.5, 0.45, 0.2], 0.9, 0.3, 26);
      } else {
        const hz = smooth(0.6, 1, t) * 0.5;
        const amb = [(mix(0.05, 0.34, sun * 0.9) * tex) * (1 - hz) + 0.3 * hz, (mix(0.035, 0.16, sun * 0.9) * tex) * (1 - hz) + 0.16 * hz, (mix(0.09, 0.2, sun * 0.9) * tex) * (1 - hz) + 0.26 * hz];
        setC(k, u, v, R_MTN, amb, [0.8, 0.5, 0.35], 1, 0.3, 26);
      }
      S.volc[k] = v > CV + 3 ? 1 : 0;
      // the crater: a lake of lava
      if (v < CV + 2.4 && Math.abs(du) < 3.8) (S.emt[k] = 4), (S.ramp[k] = R_FIX), (S.bgs[k] = 0.7);
      // rivers of lava down the flanks
      for (const rv of rivers) {
        const dv = v - CV - 1.5;
        if (dv < 0 || dv > rv.len) continue;
        const pu = rv.u0 + rv.dir * dv + 1.5 * Math.sin(dv * 0.42 + rv.ph), wd = 0.9 + 0.7 * smooth(0, 12, dv);
        if (Math.abs(u - pu) <= wd) (S.emt[k] = 3), (S.ramp[k] = R_FIX), (S.emw[k] = 1 - dv / rv.len), (S.emp[k] = dv * 0.5 + rv.ph), (S.bgs[k] = 0.55);
      }
    });

    // ---- a jungle headland on the right ------------------------------------------------
    cellsIn(98, H0 - 12, LW, H0 + 18, (col, row, k, u, v) => {
      const top = H0 - 1 - 6 * smooth(100, 150, u) + (fbm(u * 0.07, 3.3 + seed, 3) - 0.5) * 6 + (hash(Math.floor(u * 0.6), 5) - 0.5) * 1.6;
      const bot = H0 + 1 + 14 * smooth(104, 154, u);
      if (v < top || v > bot) return;
      const h = S.hv[k];
      setC(k, u, v, R_FOL, [0.018 + 0.02 * h, 0.06 + 0.04 * h, 0.055 + 0.02 * h], [0.5, 0.45, 0.2], 0.9, 0.3, 30);
    });

    // ---- helpers for the foreground ---------------------------------------------------
    const segGlyph = (du, dv) => {
      const a = (((Math.atan2(dv, du) % Math.PI) + Math.PI) % Math.PI);
      return a < 0.35 || a > 2.79 ? "-" : a < 1.25 ? "\\" : a < 1.89 ? "|" : "/";
    };
    const seg = (u0, v0, u1, v1, amb, lit, gain, gch) => {
      const n = Math.max(1, Math.ceil(Math.hypot(u1 - u0, v1 - v0) / 0.55)), ch = gch || segGlyph(u1 - u0, v1 - v0);
      for (let i = 0; i <= n; i++) {
        paintAt(mix(u0, u1, i / n), mix(v0, v1, i / n), (k, u, v) => {
          const h = S.hv[k];
          setC(k, u, v, R_FIX, [amb[0] * (0.8 + 0.5 * h), amb[1] * (0.8 + 0.5 * h), amb[2] * (0.8 + 0.5 * h)], lit, 0.8, gain);
          S.gl[k] = G(ch);
        });
      }
    };
    const segDist = (u, v, ax, ay, bx, by) => {
      const dx = bx - ax, dy = by - ay, t = clamp(((u - ax) * dx + (v - ay) * dy) / (dx * dx + dy * dy || 1));
      return Math.hypot(u - (ax + dx * t), v - (ay + dy * t));
    };
    const palm = (bx, by, cx, cy, qx, qy, n, L, droop, sd) => {
      for (let i = 0; i <= 80; i++) {
        const t = i / 80, pu = (1 - t) ** 2 * bx + 2 * (1 - t) * t * qx + t * t * cx, pv = (1 - t) ** 2 * by + 2 * (1 - t) * t * qy + t * t * cy, r = mix(1.9, 1, t);
        cellsIn(pu - r - 1, pv - r - 1, pu + r + 1, pv + r + 1, (col, row, k, u, v) => {
          if (Math.hypot(u - pu, v - pv) > r) return;
          const nx = (u - pu) / r;
          setC(k, u, v, R_OBJ, [0.06, 0.04, 0.04], [0.6, 0.35, 0.2], 0.35 + 0.5 * (0.5 + 0.5 * nx * Math.sign(CU - bx)), 0.35);
        });
      }
      for (let i = 0; i < n; i++) {
        const a = -Math.PI + ((i + 0.5) / n) * Math.PI + (hash(i, sd) - 0.5) * 0.25, dxn = Math.cos(a), dyn = Math.sin(a) * 0.8;
        const len = L * (0.8 + 0.35 * hash(i * 3, sd)), P = [];
        for (let j = 0; j <= 22; j++) {
          const s = j / 22;
          P.push([cx + len * s * dxn, cy + len * s * dyn + droop * len * s * s * (0.6 + 0.4 * Math.abs(dxn))]);
        }
        for (let j = 0; j < 22; j++) seg(P[j][0], P[j][1], P[j + 1][0], P[j + 1][1], [0.03, 0.09, 0.07], [0.3, 0.45, 0.2], 0.3);
        for (let j = 2; j < 22; j++) {
          const tx = P[j + 1][0] - P[j - 1][0], ty = P[j + 1][1] - P[j - 1][1], tl = Math.hypot(tx, ty) || 1, s = j / 22;
          for (const side of [-1, 1]) {
            const ca = Math.cos(side * 1), sa = Math.sin(side * 1);
            const lx = (tx / tl) * ca - (ty / tl) * sa, ly = (tx / tl) * sa + (ty / tl) * ca + 0.5;
            const ll = 5.2 * (1 - s * 0.55) * (0.8 + 0.4 * hash(j * 5 + i, sd));
            seg(P[j][0], P[j][1], P[j][0] + lx * ll, P[j][1] + ly * ll, [0.028, 0.08, 0.065], [0.3, 0.45, 0.2], 0.3);
          }
        }
      }
    };
    palm(126, 62, 124, 51, 126, 56, 7, 8, 0.9, 11);
    palm(139, 66, 140, 54, 138, 60, 7, 8.5, 0.9, 12);
    palm(5, 101, 17, 50, 1, 76, 8, 19, 1.05, 3);
    palm(153, 101, 143, 56, 156, 80, 8, 19, 1, 4);

    // ---- a driftwood log for the monkey ------------------------------------------------
    const log = (ax, ay, bx, by, r) =>
      cellsIn(Math.min(ax, bx) - r - 1, Math.min(ay, by) - r - 1, Math.max(ax, bx) + r + 1, Math.max(ay, by) + r + 1, (col, row, k, u, v) => {
        const d = segDist(u, v, ax, ay, bx, by);
        if (d > r + 0.6 * (hash(col, row) - 0.5)) return;
        const dv = (v - (ay + by) / 2) / r;
        setC(k, u, v, R_OBJ, [0.1, 0.075, 0.07], [0.6, 0.4, 0.28], clamp(0.7 - 0.5 * dv), 0.9);
      });
    log(28, MK[1] + 3.4, 69, MK[1] + 3.6, 3.4);
    log(30, MK[1] + 2.4, 22, MK[1] - 2, 1.1); // a broken limb at the root end

    // written in the sand
    "P U R A   V I D A".split("").forEach((ch, i) => {
      if (ch === " ") return;
      paintAt(86 + i, 92.5, (k, u, v) => {
        setC(k, u, v, R_FIX, [0.52, 0.32, 0.2], [0.8, 0.5, 0.3], 0.8, 0.5, 50);
        S.gl[k] = G(ch), S.bgs[k] = 0.42;
      });
    });

    // the water: the cells the sea and surf may change
    S.seaL = [];
    for (let k = 0; k < N; k++) if (S.sea[k]) S.seaL.push(k, k % W, (k / W) | 0);
    // clouds go on the sky; ash goes on the sky above the crater
    S.sky = S.sky.filter((k) => S.ramp[k] === R_SKY);
    S.skyL = [], S.plume = [];
    for (const k of S.sky) {
      const col = k % W, row = (k / W) | 0, u = (col + 0.5) / sx, v = (row + 0.5) / sy;
      S.skyL.push(k, col, row);
      if (u > 66 && v < CV + 1) S.plume.push(k, col, row);
    }
    S.stars = [];
    for (const k of S.sky) {
      const col = k % W, row = (k / W) | 0, v = (row + 0.5) / sy;
      if (v > 26) continue;
      if (hash(col * 5 + 11, row * 3 + seed * 7) < 0.02 + 0.03 * (1 - v / 26)) {
        const b = 0.35 + 0.65 * hash(col, row * 2 + 1);
        S.stars.push({ k, b, ph: hash(row, col) * 6.28, sp: 0.8 + 2.4 * hash(col + 9, row) });
      }
    }
    return S;
  }

  // ---- the eruption: a state machine, lava bombs, and rocks rolling down the flanks ------------
  function newState(seed) {
    return { rng: mulberry32(seed * 7919 + 13), t: 0, acc: 0, Es: 0.7, I: 1, pulse: 0, mode: 1, timer: 12, nextBurst: 0.4, bombs: [], hot: [], flash: 0, bolt: [] };
  }
  function spawn(st, n, power) {
    const rng = st.rng;
    for (let i = 0; i < n && st.bombs.length < 90; i++) {
      st.bombs.push({ u: CU + (rng() - 0.5) * 5, v: CV + 1, vx: (rng() - 0.5) * 38 * power + 5, vy: -(26 + rng() * 38) * power, age: 0, life: 3 + rng() * 0.8, tr: [] });
    }
  }
  function stepSim(S, st) {
    const dt = 1 / SIM_HZ, rng = st.rng, W = S.W, H = S.H;
    st.t += dt;
    st.timer -= dt;
    let target;
    if (st.mode === 1) {
      target = 0.8 + 0.2 * Math.sin(st.t * 1.7);
      st.nextBurst -= dt;
      if (st.nextBurst <= 0) {
        st.pulse = 1;
        st.nextBurst = 0.9 + rng() * 1.6;
        spawn(st, 7 + ((rng() * 9) | 0), 1);
      }
      if (st.timer <= 0) (st.mode = 0), (st.timer = 3.5 + rng() * 3);
    } else {
      target = 0.14;
      if (rng() < 0.03) spawn(st, 1 + ((rng() * 3) | 0), 0.6);
      if (st.timer <= 0) (st.mode = 1), (st.timer = 9 + rng() * 5), (st.nextBurst = 0.2);
    }
    st.Es += (target - st.Es) * (target > st.Es ? 0.05 : 0.02);
    st.pulse *= 0.9;
    st.I = clamp(0.3 + 0.72 * st.Es + 0.4 * st.pulse + 0.04 * Math.sin(st.t * 8.3), 0, 1.5);
    if (rng() < st.Es * st.Es * 0.7) spawn(st, 1, 0.8);
    // bombs fly, fall and land on the cone
    for (let i = st.bombs.length - 1; i >= 0; i--) {
      const b = st.bombs[i];
      b.tr.push(b.u, b.v);
      if (b.tr.length > 6) b.tr.splice(0, 2);
      b.vy += 46 * dt, b.u += b.vx * dt, b.v += b.vy * dt, b.age += dt;
      let dead = b.age > b.life || b.v > 80 || b.u < -4 || b.u > LW + 4;
      if (!dead && b.vy > 0 && b.v > CV + 3) {
        const col = Math.floor((b.u * W) / LW), row = Math.floor((b.v * H) / LH);
        if (col >= 0 && col < W && row >= 0 && row < H && S.volc[row * W + col]) {
          dead = true;
          if (rng() < 0.7) st.hot.push({ u: b.u, v: b.v, age: 0, life: 2.4 + rng() * 2 });
        }
      }
      if (dead) st.bombs.splice(i, 1);
    }
    for (let i = st.hot.length - 1; i >= 0; i--) {
      const h = st.hot[i];
      h.age += dt, h.u += (h.u < CU ? -2.6 : 2.6) * dt, h.v += 3.2 * dt;
      const col = Math.floor((h.u * W) / LW), row = Math.floor((h.v * H) / LH);
      if (h.age > h.life || col < 0 || col >= W || row < 0 || row >= H || !S.volc[row * W + col]) st.hot.splice(i, 1);
    }
    // lightning in the ash
    if (st.flash > 0) st.flash -= dt;
    else if (st.Es > 0.55 && rng() < 0.012) {
      st.flash = 0.2;
      const hc = 3 + 22 * st.Es;
      let u = CU + 0.28 * hc * 0.6 + (rng() - 0.5) * 6, v = CV - hc * 0.55;
      st.bolt = [];
      for (let j = 0; j < 9; j++) st.bolt.push([u, v]), (u += (rng() - 0.5) * 4.5), (v += 1.6 + rng());
    }
  }

  // ---- one frame -----------------------------------------------------------------------------
  function frame(S, st, OG, OC, OB) {
    const { W, H } = S, t = st.t, I = st.I, Es = st.Es, cu = LW / W, cv = LH / H;
    const q = (x) => LVQ[x <= 0 ? 0 : x >= 1 ? 255 : (x * 255 + 0.5) | 0];
    const qc = (r, g, b) => (q(r) << 8) | (q(g) << 4) | q(b);
    const dr = (c) => LVL[(c >> 8) & 15] / 255, dg = (c) => LVL[(c >> 4) & 15] / 255, db = (c) => LVL[c & 15] / 255;

    // the static scene, lit by the volcano
    for (let row = 0; row < H; row++) {
      for (let col = 0; col < W; col++) {
        const k = row * W + col, bay = BAYER[(row & 3) * 4 + (col & 3)], em = S.emt[k];
        if (em === 3) {
          const pulse = 0.5 + 0.5 * Math.sin(S.emp[k] * 2 - t * 2.4);
          const h = clamp((0.3 + 0.4 * pulse + 0.45 * Es) * (0.35 + 0.65 * S.emw[k]) + 0.1);
          fireColor(h);
          OG[k] = FIRE[clamp(Math.round(h * (FIRE.length - 1) + bay * 0.8), 1, FIRE.length - 1)];
          OC[k] = qc(fcol[0], fcol[1], fcol[2]);
          OB[k] = qc(fcol[0] * 0.55, fcol[1] * 0.5, fcol[2] * 0.4);
          continue;
        }
        if (em === 4) {
          const h = clamp(0.62 + 0.25 * Math.sin(t * 3 + S.hv[k] * 20) + 0.3 * Es + 0.2 * st.pulse);
          fireColor(h);
          OG[k] = FIRE[clamp(Math.round(h * (FIRE.length - 1) + bay), 3, FIRE.length - 1)];
          OC[k] = qc(fcol[0], fcol[1], fcol[2]);
          OB[k] = qc(fcol[0] * 0.7, fcol[1] * 0.6, fcol[2] * 0.45);
          continue;
        }
        const r = S.r0[k] + S.r1[k] * I, g = S.g0[k] + S.g1[k] * I, b = S.b0[k] + S.b1[k] * I, bs = S.bgs[k], rp = S.ramp[k];
        OB[k] = qc(r * bs, g * bs, b * bs);
        if (rp === R_SKY) {
          OG[k] = 0, OC[k] = 0;
          continue;
        }
        if (rp === R_FIX) {
          OG[k] = S.gl[k], OC[k] = qc(r * 1.1, g * 1.1, b * 1.1);
          continue;
        }
        const p = Math.max(r, g, b, 1e-4), R = RAMPS[rp], n = R.length;
        let x, jit;
        if (rp === R_GRD) (x = clamp(p * 1.7)), (jit = (S.hv[k] - 0.5) * 0.8);
        else if (rp === R_MTN) (x = clamp(p * 1.5)), (jit = (S.hv[k] - 0.5) * 0.9);
        else (x = clamp(p * 1.2)), (jit = (S.hv[k] - 0.5) * (rp === R_FOL ? 1.6 : 0.5));
        const gl = R[clamp(Math.round(x * (n - 1) + bay * 0.95 + jit), 0, n - 1)];
        if (gl === 0) {
          OG[k] = 0, OC[k] = 0;
          continue;
        }
        OG[k] = gl;
        if (rp === R_GRD) {
          const s = Math.min(1.6, ((0.5 + p) / (1 + p) / Math.max(COV[gl], 0.1)) * 0.5);
          OC[k] = qc(r * s, g * s, b * s);
        } else OC[k] = qc(r * 1.15, g * 1.15, b * 1.15);
      }
    }

    // the sea: waves, a glitter road from the sun, the volcano's glow, and surf on the sand
    const sl = S.seaL;
    for (let i = 0; i < sl.length; i += 3) {
      const k = sl[i], u = (sl[i + 1] + 0.5) * cu, v = (sl[i + 2] + 0.5) * cv;
      const surge = 0.5 + 0.5 * Math.sin(t * 0.5 + u * 0.018);
      const sh = 78.5 + 3.4 * surge + 0.9 * Math.sin(u * 0.11 + t * 0.9) + 0.6 * Math.sin(u * 0.31 - t * 1.3);
      if (v >= sh + 2.6) continue;
      if (v >= sh) {
        const ob = OB[k];
        OB[k] = qc(dr(ob) * 0.55 + 0.06, dg(ob) * 0.5 + 0.035, db(ob) * 0.55 + 0.06);
        continue;
      }
      if (v >= sh - 1.5) {
        const f = noise(u * 0.5 + t * 0.3, v * 1.2);
        OG[k] = f > 0.62 ? G("~") : f > 0.32 ? G("-") : G(":");
        const a = 0.65 + 0.35 * Math.sin(t * 2 + u * 0.4);
        OC[k] = qc(0.95 * a, 0.8 * a, 0.8 * a);
        OB[k] = qc(0.3 + 0.1 * I, 0.25, 0.3);
        continue;
      }
      const tt = clamp((v - H0) / (sh - H0)), c = stops(WATER, tt);
      let r = c[0], g = c[1], b = c[2];
      const wn = noise(u * 0.22 + t * 0.35, v * 0.9 - t * 0.55);
      const sw = 2.5 + (v - H0) * 0.33;
      const sunC = Math.exp(-(((u - SUNP[0]) / sw) ** 2)) * (0.25 + 0.9 * smooth(0.48, 0.72, noise(u * 0.5 + t * 0.2, v * 1.4 - t * 1.8))) * (1 - 0.4 * tt);
      const lw = 2.2 + (v - H0) * 0.18;
      const lavC = Math.exp(-(((u - CU) / lw) ** 2)) * I * smooth(0.5, 0.75, noise(u * 0.6 - t * 0.3, v * 1.6 - t * 1.5)) * 0.8 * (1 - 0.5 * tt);
      r += 0.9 * sunC + lavC, g += 0.56 * sunC + 0.3 * lavC, b += 0.25 * sunC + 0.08 * lavC;
      OG[k] = sunC > 0.5 || lavC > 0.4 ? G("=") : sunC > 0.22 || lavC > 0.2 ? G("~") : wn > 0.52 ? G("~") : wn > 0.36 ? G("-") : 0;
      OC[k] = qc(r * 1.35 + 0.05, g * 1.35 + 0.05, b * 1.3 + 0.05);
      OB[k] = qc(r * 0.78, g * 0.78, b * 0.78);
    }

    // clouds drifting across the dusk
    const kl = S.skyL;
    for (let i = 0; i < kl.length; i += 3) {
      const k = kl[i], u = (kl[i + 1] + 0.5) * cu, v = (kl[i + 2] + 0.5) * cv;
      const band = smooth(4, 14, v) * (1 - smooth(46, 56, v));
      if (band <= 0) continue;
      const d = smooth(0.52, 0.74, fbm(u * 0.045 - t * 0.12, v * 0.11, 3)) * band;
      if (d < 0.12) continue;
      const ob = OB[k], warm = smooth(10, 54, v);
      const lav = Math.exp(-Math.hypot(u - CU, v - CV) / 30) * I * d;
      const m = 0.35 + 0.4 * d;
      const r = mix(dr(ob), 0.45 + 0.5 * warm, m) + 0.5 * lav, g = mix(dg(ob), 0.2 + 0.25 * warm, m) + 0.18 * lav, b = mix(db(ob), 0.42 - 0.1 * warm, m) + 0.04 * lav;
      OG[k] = d > 0.6 ? G("=") : d > 0.35 ? G("~") : G(":");
      OC[k] = qc(r * 1.2, g * 1.2, b * 1.2);
      OB[k] = qc(r * 0.85, g * 0.85, b * 0.85);
    }
    // stars, as the dark comes on
    for (const s of S.stars) {
      if (OG[s.k]) continue;
      const b = s.b * (0.62 + 0.38 * Math.sin(t * s.sp + s.ph)) * 0.8;
      if (b < 0.25) continue;
      OG[s.k] = s.b > 0.88 && b > 0.6 ? G("+") : s.b > 0.62 ? G("*") : G(".");
      OC[s.k] = qc(b, b * 0.95, b * 0.85);
    }
    // two scarlet macaws crossing the bay
    for (let m = 0; m < 2; m++) {
      const pu = ((t * (4.2 + m * 0.5) + m * 37) % 200) - 20, pv = 20 + m * 7 + 3 * Math.sin(t * 0.6 + m * 2) + 0.18 * pu * (m ? 0.4 : -0.1);
      const up = Math.sin(t * 7 + m) > 0, glyphs = up ? ["\\", "v", "/"] : ["_", "^", "_"];
      for (let j = 0; j < 3; j++) {
        const col = Math.floor(((pu + j - 1) * W) / LW), row = Math.floor((pv * H) / LH);
        if (col < 0 || col >= W || row < 0 || row >= H) continue;
        const k = row * W + col;
        if (S.ramp[k] !== R_SKY) continue;
        OG[k] = G(glyphs[j]), OC[k] = j === 1 ? qc(0.95, 0.12, 0.08) : qc(0.95, 0.75, 0.15);
      }
    }

    // the ash column
    const Hc = 3 + 22 * Es, pl = S.plume, fl = st.flash > 0 ? st.flash / 0.2 : 0;
    for (let i = 0; i < pl.length; i += 3) {
      const k = pl[i], u = (pl[i + 1] + 0.5) * cu, v = (pl[i + 2] + 0.5) * cv, yy = CV - v + 0.5;
      if (yy < -0.5 || yy > Hc + 8) continue;
      const top = yy / (Hc + 1), cx = CU + 0.28 * yy + 2.5 * Math.sin(yy * 0.17 - t * 0.7) * top, hw = 3 + 0.26 * yy + 9 * top * top * top;
      const dx = (u - cx) / hw;
      if (dx * dx > 3) continue;
      const core = Math.exp(-dx * dx * 1.5), n = fbm(u * 0.11, yy * 0.09 - t * 0.8, 4);
      const d = core * smooth(0.3, 0.72, n + 0.3 * core) * smooth(0, 2.5, yy) * (1 - smooth(Hc - 1, Hc + 7, yy)) * (0.2 + 0.8 * Math.min(1, Es * 1.2));
      if (d < 0.1) continue;
      const warm = Math.exp(-yy / 11) * I, sunSide = dx < 0 ? 0.35 : 0.1;
      const r = 0.12 + 0.9 * warm * (0.5 + 0.5 * n) + 0.35 * sunSide + 0.5 * fl, g = 0.09 + 0.32 * warm + 0.12 * sunSide + 0.5 * fl, b = 0.11 + 0.04 * warm + 0.14 * sunSide + 0.6 * fl;
      OG[k] = d > 0.62 ? G("#") : d > 0.45 ? G("%") : d > 0.3 ? G("x") : d > 0.2 ? G(":") : G(".");
      OC[k] = qc(r * 1.3, g * 1.3, b * 1.3);
      const a = Math.min(0.9, d * 1.3), ob = OB[k];
      OB[k] = qc(mix(dr(ob), r * 0.7, a), mix(dg(ob), g * 0.7, a), mix(db(ob), b * 0.7, a));
    }
    if (st.flash > 0) {
      for (const [u, v] of st.bolt) {
        const col = Math.floor(u / cu), row = Math.floor(v / cv);
        if (col < 0 || col >= W || row < 0 || row >= H) continue;
        const k = row * W + col;
        OG[k] = G("|"), OC[k] = qc(0.95, 0.95, 1), OB[k] = qc(0.3, 0.32, 0.55);
      }
    }

    // lava bombs, and rocks rolling down the cone
    for (const bm of st.bombs) {
      const f = bm.age / bm.life;
      for (let j = 0; j < bm.tr.length; j += 2) {
        const col = Math.floor(bm.tr[j] / cu), row = Math.floor(bm.tr[j + 1] / cv);
        if (col < 0 || col >= W || row < 0 || row >= H) continue;
        const k = row * W + col, a = (j / bm.tr.length) * 0.7 * (1 - f);
        OG[k] = j > bm.tr.length - 3 ? G("+") : G("."), OC[k] = qc(0.9 * a + 0.2, 0.3 * a, 0.04);
      }
      const col = Math.floor(bm.u / cu), row = Math.floor(bm.v / cv);
      if (col < 0 || col >= W || row < 0 || row >= H) continue;
      const k = row * W + col;
      fireColor(clamp(1.1 - f));
      OG[k] = f < 0.3 ? G("@") : f < 0.65 ? G("*") : G("+");
      OC[k] = qc(fcol[0], fcol[1], fcol[2]);
      OB[k] = qc(fcol[0] * 0.5, fcol[1] * 0.4, fcol[2] * 0.25);
    }
    for (const h of st.hot) {
      const col = Math.floor(h.u / cu), row = Math.floor(h.v / cv);
      if (col < 0 || col >= W || row < 0 || row >= H) continue;
      const k = row * W + col, f = 1 - h.age / h.life;
      fireColor(0.15 + 0.5 * f);
      OG[k] = f > 0.5 ? G("*") : G("+");
      OC[k] = qc(fcol[0], fcol[1], fcol[2]);
      OB[k] = qc(fcol[0] * 0.45, fcol[1] * 0.35, fcol[2] * 0.2);
    }

    monkey(S, st, OG, OC, OB, qc);
  }

  // ---- the monkey: a white-faced capuchin on the log, eating a banana ------------------------------
  const MS = 1.35; // the monkey's scale
  const FUR = [0.27, 0.16, 0.1], CREAM = [0.9, 0.78, 0.6], CAP = [0.05, 0.035, 0.03], SKIN = [0.9, 0.58, 0.46], BANANA = [1, 0.82, 0.14], DARK = [0.02, 0.02, 0.025], MOUTH = [0.12, 0.04, 0.04];
  const MCOL = [FUR, CREAM, CAP, SKIN, BANANA, DARK, MOUTH];
  function monkey(S, st, OG, OC, OB, qc) {
    const { W, H } = S, t = st.t, I = st.I, Es = st.Es, sx = W / LW, sy = H / LH;
    const ax = MK[0], ay = MK[1];
    const cyc = (t % 7.5) / 7.5, raise = smooth(0.04, 0.14, cyc) - smooth(0.66, 0.78, cyc), chew = raise > 0.9;
    const hb = chew ? Math.sin(t * 14) * 0.4 : 0, hx = ax + 3.4, hy = ay - 21.5 - Es * 0.3 + hb + raise * 0.4;
    const blink = (t + 1.3) % 3.4 > 3.27;
    const handU = mix(ax + 7.2, hx + 4.9, raise), handV = mix(ay - 8.2, hy + 2.5, raise);
    const P = [];
    const X = (x) => ax + (x - ax) * MS, Y = (y) => ay + (y - ay) * MS;
    const E = (cx, cy, rx, ry, c) => P.push([0, X(cx), Y(cy), rx * MS, ry * MS, c]);
    const C = (x0, y0, x1, y1, r, c) => P.push([1, X(x0), Y(y0), X(x1), Y(y1), r * MS, c]);
    // tail, hanging behind the log and swaying
    let pu = ax - 5.6, pv = ay - 3;
    for (let i = 1; i <= 11; i++) {
      const s = i / 11, nu = ax - 5.8 - 2.2 * s + Math.sin(t * 1.5 - s * 2.2) * s * 3.2 + 1.6 * s ** 4, nv = ay - 3 + s * 13.5;
      C(pu, pv, nu, nv, 1.15, 0);
      pu = nu, pv = nv;
    }
    E(ax + 0.5, ay - 9.5, 6.4, 8.4, 0); // body
    C(ax + 1.2, ay - 14.8, ax + 6.5, ay - 5.6, 1.5, 0); // the resting arm
    E(ax + 3.4, ay - 11.4, 3, 4.6, 1); // pale chest
    C(ax + 0.5, ay - 3.2, ax + 7, ay - 4.6, 2.5, 0); // thigh
    C(ax + 7, ay - 4.6, ax + 8.8, ay - 0.8, 1.7, 0); // shin
    E(ax + 10.4, ay - 0.6, 2.1, 1, 0); // foot
    E(hx, hy, 4.3, 4, 0); // head
    E(hx + 1.2, hy + 0.6, 3.5, 3.3, 1); // pale face ring
    E(hx - 0.2, hy - 2.4, 4, 2, 2); // dark cap
    E(hx - 3.2, hy - 0.8, 1.3, 1.5, 0); // ear
    E(hx + 2.5, hy + 0.9, 2.1, 2.2, 3); // bare face
    if (chew) E(hx + 4.2, hy + 2.2, 0.8, 0.3 + 0.6 * Math.abs(Math.sin(t * 14)), 6);
    if (!blink) E(hx + 3.2, hy - 0.2, 0.55, 0.6, 5);
    C(ax + 2.6, ay - 14.4, handU, handV, 1.5, 0); // the arm holding the banana
    C(handU, handV, handU + 2.2, handV - 1.4, 1, 4), C(handU + 2.2, handV - 1.4, handU + 4.2, handV - 0.6, 0.9, 4); // banana
    const x0 = ax - 14 * MS, x1 = ax + 15 * MS, y0 = ay - 28 * MS, y1 = ay + 12 * MS;
    const c0 = Math.max(0, Math.floor(x0 * sx)), c1 = Math.min(W - 1, Math.floor(x1 * sx)), r0 = Math.max(0, Math.floor(y0 * sy)), r1 = Math.min(H - 1, Math.floor(y1 * sy));
    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        const u = (col + 0.5) / sx, v = (row + 0.5) / sy;
        let hit = -1, nx = 0;
        for (let i = P.length - 1; i >= 0; i--) {
          const p = P[i];
          if (p[0] === 0) {
            const dx = (u - p[1]) / p[3], dy = (v - p[2]) / p[4];
            if (dx * dx + dy * dy <= 1) (hit = i), (nx = dx);
          } else {
            const ex = p[3] - p[1], ey = p[4] - p[2], tt = clamp(((u - p[1]) * ex + (v - p[2]) * ey) / (ex * ex + ey * ey || 1));
            const qu = p[1] + ex * tt, qv = p[2] + ey * tt, d = Math.hypot(u - qu, v - qv);
            if (d <= p[5]) (hit = i), (nx = (u - qu) / p[5]);
          }
          if (hit >= 0) break;
        }
        if (hit < 0) continue;
        const k = row * W + col, p = P[hit], ci = p[0] === 0 ? p[5] : p[6], base = MCOL[ci];
        if (ci === 5 || ci === 6) {
          OG[k] = G(ci === 5 ? "o" : ":"), OC[k] = qc(0.5, 0.45, 0.4), OB[k] = qc(DARK[0], DARK[1], DARK[2]);
          continue;
        }
        // dusk ambient, the volcano on the side that faces it, the setting sun as a rim on the other
        const lavaT = I * (0.2 + 0.9 * Math.max(0, 0.35 + nx * 0.65)), rim = 0.75 * Math.pow(Math.max(0, -nx), 1.4);
        const r = base[0] * (0.34 + lavaT * 0.45) + rim * 0.8, g = base[1] * (0.26 + lavaT * 0.22) + rim * 0.5, b = base[2] * (0.34 + lavaT * 0.07) + rim * 0.22;
        const pp = Math.max(r, g, b), bay = BAYER[(row & 3) * 4 + (col & 3)];
        OG[k] = RAMPS[R_OBJ][clamp(Math.round(clamp(pp * 1.5) * 6 + bay * 0.9), 0, 6)];
        OC[k] = qc(r * 1.15, g * 1.15, b * 1.15);
        const bg = ci === 0 || ci === 2 ? 0.5 : 0.6;
        OB[k] = qc(r * bg, g * bg, b * bg);
      }
    }
  }

  // ---- drawing: a glyph atlas, so a frame is a few thousand drawImage calls ------------------------
  class Atlas {
    constructor() {
      this.cv = document.createElement("canvas");
      this.cx = this.cv.getContext("2d");
      this.map = new Map();
      this.n = 0;
      this.cols = 64;
      this.max = 4096;
    }
    setSize(cw, ch, font) {
      this.cw = cw, this.ch = ch, this.font = font;
      this.cv.width = this.cols * cw;
      this.cv.height = (this.max / this.cols) * ch;
      this.reset();
    }
    reset() {
      this.cx.clearRect(0, 0, this.cv.width, this.cv.height);
      this.map.clear();
      this.n = 0;
    }
    slot(g, c) {
      const key = g * 4096 + c;
      let s = this.map.get(key);
      if (s !== undefined) return s;
      if (this.n >= this.max) this.reset();
      s = this.n++;
      const x = (s % this.cols) * this.cw, y = Math.floor(s / this.cols) * this.ch, cx = this.cx;
      cx.font = this.font;
      cx.textAlign = "center";
      cx.textBaseline = "alphabetic";
      cx.fillStyle = `rgb(${LVL[(c >> 8) & 15]},${LVL[(c >> 4) & 15]},${LVL[c & 15]})`;
      cx.fillText(GLY[g], x + this.cw / 2, y + this.ch * 0.8);
      this.map.set(key, s);
      return s;
    }
  }

  const STYLE = `
    :host { display: block; position: relative; overflow: hidden; aspect-ratio: 16 / 10; background: var(--pura-bg, #0d1511); contain: content; }
    canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; object-fit: cover; object-position: var(--pura-pos, 50% 78%); }
    :host(:not([fade="off"])) canvas {
      -webkit-mask-image: linear-gradient(to right, transparent, #000 7%, #000 93%, transparent), linear-gradient(to bottom, transparent, #000 14%, #000 88%, transparent);
      -webkit-mask-composite: source-in;
      mask-image: linear-gradient(to right, transparent, #000 7%, #000 93%, transparent), linear-gradient(to bottom, transparent, #000 14%, #000 88%, transparent);
      mask-composite: intersect;
    }`;
  const FONT = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "DejaVu Sans Mono", "Liberation Mono", monospace';

  class PuraVida extends HTMLElement {
    static get observedAttributes() {
      return ["cols", "fps", "seed", "label"];
    }
    constructor() {
      super();
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `<style>${STYLE}</style><canvas></canvas>`;
      this._cv = root.querySelector("canvas");
      this._ctx = this._cv.getContext("2d");
      this._atlas = new Atlas();
      this._playing = false;
      this._onScreen = false;
    }
    connectedCallback() {
      if (!this.hasAttribute("role")) this.setAttribute("role", "img");
      this._label();
      this._init();
      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(this);
      this._io = new IntersectionObserver((e) => {
        this._onScreen = e[e.length - 1].isIntersecting;
        this._run();
      });
      this._io.observe(this);
      this._vis = () => this._run();
      document.addEventListener("visibilitychange", this._vis);
      this._rm = matchMedia("(prefers-reduced-motion: reduce)");
      this._rm.addEventListener("change", this._vis);
      // draw again once a web font arrives, so the glyphs match the page
      this._fonts = () => (this._atlas.reset(), this._prevG && this._prevG.fill(255), this._draw());
      if (document.fonts) {
        document.fonts.addEventListener("loadingdone", this._fonts);
        document.fonts.load('12px "JetBrains Mono"').catch(() => {});
      }
    }
    disconnectedCallback() {
      this._ro && this._ro.disconnect();
      this._io && this._io.disconnect();
      document.removeEventListener("visibilitychange", this._vis);
      this._rm && this._rm.removeEventListener("change", this._vis);
      document.fonts && document.fonts.removeEventListener("loadingdone", this._fonts);
      cancelAnimationFrame(this._raf);
      this._raf = 0;
    }
    attributeChangedCallback(name) {
      if (!this.isConnected || !this._S) return;
      if (name === "label") this._label();
      else if (name === "fps") this._run();
      else (this._init(), this._resize());
    }
    _label() {
      this.setAttribute("aria-label", this.getAttribute("label") || "An animated ASCII beach in Costa Rica at sunset: a volcano erupting across the bay, and a capuchin monkey eating a banana on a driftwood log. Pura vida.");
    }
    _init() {
      const cols = clamp(Math.round(Number(this.getAttribute("cols")) || 160), 80, 240);
      const rows = Math.round(cols * 0.3125);
      const seed = Number(this.getAttribute("seed")) || 1;
      this._W = cols, this._H = rows;
      this._S = build(cols, rows, seed | 0);
      this._st = newState(seed | 0);
      this._OG = new Uint8Array(cols * rows);
      this._OC = new Uint16Array(cols * rows);
      this._OB = new Uint16Array(cols * rows);
      this._prevG = new Uint8Array(cols * rows).fill(255);
      this._prevC = new Uint16Array(cols * rows);
      this._prevB = new Uint16Array(cols * rows);
      this._bgStyle = [];
      this._step(3); // the eruption is already under way when the page loads
      frame(this._S, this._st, this._OG, this._OC, this._OB);
      this._cw = 0;
    }
    _step(sec) {
      const n = Math.round(sec * SIM_HZ);
      for (let i = 0; i < n; i++) stepSim(this._S, this._st);
    }
    _resize() {
      const box = this.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const dpr = window.devicePixelRatio || 1;
      const cw = clamp(Math.ceil(Math.max((box.width * dpr) / this._W, (box.height * dpr) / (this._H * 2))), 3, 26), ch = cw * 2;
      if (cw === this._cw) return;
      this._cw = cw, this._ch = ch;
      this._cv.width = this._W * cw;
      this._cv.height = this._H * ch;
      this._atlas.setSize(cw, ch, `${(cw / 0.6).toFixed(1)}px ${FONT}`);
      this._prevG.fill(255);
      this._draw();
      this._run();
    }
    _draw() {
      if (!this._cw) return;
      const { _W: W, _H: H, _cw: cw, _ch: ch, _ctx: ctx, _atlas: at, _OG: OG, _OC: OC, _OB: OB, _prevG: pG, _prevC: pC, _prevB: pB, _bgStyle: bgs } = this;
      for (let row = 0; row < H; row++) {
        for (let col = 0; col < W; col++) {
          const k = row * W + col, g = OG[k], c = g ? OC[k] : 0, b = OB[k];
          if (g === pG[k] && c === pC[k] && b === pB[k]) continue;
          pG[k] = g, pC[k] = c, pB[k] = b;
          ctx.fillStyle = bgs[b] || (bgs[b] = `rgb(${LVL[(b >> 8) & 15]},${LVL[(b >> 4) & 15]},${LVL[b & 15]})`);
          ctx.fillRect(col * cw, row * ch, cw, ch);
          if (g === 0) continue;
          const s = at.slot(g, c);
          ctx.drawImage(at.cv, (s % at.cols) * cw, Math.floor(s / at.cols) * ch, cw, ch, col * cw, row * ch, cw, ch);
        }
      }
    }
    _tick(dt) {
      this._st.acc += dt;
      let n = 0;
      while (this._st.acc >= 1 / SIM_HZ && n < 6) (this._st.acc -= 1 / SIM_HZ), stepSim(this._S, this._st), n++;
      if (n === 6) this._st.acc = 0;
      frame(this._S, this._st, this._OG, this._OC, this._OB);
      this._draw();
    }
    _run() {
      const still = this._rm && this._rm.matches && !this.hasAttribute("motion");
      const go = !this._paused && this._onScreen && !document.hidden && !still && this._cw > 0;
      if (go && !this._raf) {
        this._last = performance.now();
        const fps = clamp(Number(this.getAttribute("fps")) || 20, 1, 60);
        const loop = (now) => {
          this._raf = requestAnimationFrame(loop);
          const dt = now - this._last;
          if (dt < 1000 / fps - 3) return;
          this._last = now;
          this._tick(Math.min(dt, 100) / 1000);
        };
        this._raf = requestAnimationFrame(loop);
      } else if (!go && this._raf) {
        cancelAnimationFrame(this._raf);
        this._raf = 0;
      }
    }
    pause() {
      this._paused = true;
      this._run();
    }
    play() {
      this._paused = false;
      this._run();
    }
    advance(sec) {
      this._step(sec);
      frame(this._S, this._st, this._OG, this._OC, this._OB);
      this._draw();
    }
  }
  customElements.define(TAG, PuraVida);
})();
