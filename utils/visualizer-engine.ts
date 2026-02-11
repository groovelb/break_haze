import { createNoise2D } from './simplex-noise';
import { ColorPalette } from './color-extract';

type Mode = 'thunder' | 'cloud';

// --- Audio Band Indices (128 bins from fftSize=256) ---
const BAND_SUB_BASS: [number, number] = [0, 8];
const BAND_BASS: [number, number] = [8, 24];
const BAND_MID: [number, number] = [24, 64];
const BAND_HIGH: [number, number] = [64, 128];

// --- 3 color slots: primary(0), secondary(1), accent(2) ---
const NUM_COLORS = 3;
// Spawn weight: 45% primary, 35% secondary, 20% accent
const COLOR_WEIGHTS = [0.45, 0.80, 1.0]; // cumulative

interface ModeConfig {
  clearAlpha: number;
  baseSpeed: number;
  noiseScale: number;
  noiseStrength: number;
  archStrength: number;
  archSpread: number;
  spawnRate: number;
  maxLife: [number, number];
  sizeRange: [number, number];
  bassVelocityMult: number;
  burstThreshold: number;
  burstAmount: number;
  idleClearAlpha: number;
  idleSpawnRate: number;
  idleSpeedMult: number;
  idleAlphaCap: number;
}

const CONFIGS: Record<Mode, ModeConfig> = {
  cloud: {
    clearAlpha: 0.04,
    baseSpeed: 0.6,
    noiseScale: 0.003,
    noiseStrength: 1.2,
    archStrength: 0.35,
    archSpread: 1.4,
    spawnRate: 12,
    maxLife: [180, 400],
    sizeRange: [0.8, 2.5],
    bassVelocityMult: 1.5,
    burstThreshold: 180,
    burstAmount: 20,
    idleClearAlpha: 0.015,
    idleSpawnRate: 2,
    idleSpeedMult: 0.25,
    idleAlphaCap: 0.12,
  },
  thunder: {
    clearAlpha: 0.12,
    baseSpeed: 1.4,
    noiseScale: 0.005,
    noiseStrength: 2.0,
    archStrength: 0.5,
    archSpread: 1.0,
    spawnRate: 18,
    maxLife: [80, 200],
    sizeRange: [0.5, 3.0],
    bassVelocityMult: 3.0,
    burstThreshold: 150,
    burstAmount: 50,
    idleClearAlpha: 0.02,
    idleSpawnRate: 2,
    idleSpeedMult: 0.2,
    idleAlphaCap: 0.10,
  },
};

interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  lineWidth: number;
  speed: number;
  color: string;
}

const MAX_RINGS = 12;
const CELL_SIZE = 20;
const MAX_PARTICLES = 4000;

// Parse "rgb(r, g, b)" -> [r, g, b] or null
function parseRgb(s: string): [number, number, number] | null {
  const m = s.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  return m ? [+m[1], +m[2], +m[3]] : null;
}

export class VisualizerEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;

  // SoA particle data
  private px = new Float32Array(MAX_PARTICLES);
  private py = new Float32Array(MAX_PARTICLES);
  private vx = new Float32Array(MAX_PARTICLES);
  private vy = new Float32Array(MAX_PARTICLES);
  private life = new Float32Array(MAX_PARTICLES);
  private maxLife = new Float32Array(MAX_PARTICLES);
  private alpha = new Float32Array(MAX_PARTICLES);
  private size = new Float32Array(MAX_PARTICLES);
  private colorIdx = new Uint8Array(MAX_PARTICLES); // 0=primary, 1=secondary, 2=accent
  private count = 0;

  // Flow field
  private fieldCols = 0;
  private fieldRows = 0;
  private fieldAngles: Float32Array = new Float32Array(0);
  private noise2D = createNoise2D(42);

  // Shockwave rings
  private rings: ShockwaveRing[] = [];
  private lastBassHitTime = 0;
  private ringColorToggle = 0; // alternates ring colors

  // Audio
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array = new Uint8Array(128);
  private smoothBands = { subBass: 0, bass: 0, mid: 0, high: 0 };
  private prevBass = 0;

  // Multi-color state — 3 rgba prefixes, 3 shadow colors, 3 ring-ready colors
  private palette: ColorPalette | null = null;
  private colors: string[] = ['rgba(255,255,255,', 'rgba(255,255,255,', 'rgba(255,255,255,']; // rgba prefix per slot
  private shadowColors: string[] = ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.4)'];
  private ringColors: string[] = ['#ffffff', '#ffffff', '#ffffff'];

  // State
  private mode: Mode = 'cloud';
  private isPlaying = false;
  private time = 0;
  private rafId = 0;
  private running = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  setAnalyser(analyser: AnalyserNode | null) {
    this.analyser = analyser;
    if (analyser) {
      this.freqData = new Uint8Array(analyser.frequencyBinCount);
    }
  }

  setMode(mode: Mode) {
    this.mode = mode;
  }

  setPlaying(playing: boolean) {
    this.isPlaying = playing;
    if (!playing) {
      this.resetToWhite();
    } else if (this.palette) {
      this.applyPalette(this.palette);
    }
  }

  setColors(palette: ColorPalette | null) {
    this.palette = palette;
    if (palette && this.isPlaying) {
      this.applyPalette(palette);
    }
  }

  private resetToWhite() {
    for (let i = 0; i < NUM_COLORS; i++) {
      this.colors[i] = 'rgba(255,255,255,';
      this.shadowColors[i] = 'rgba(255,255,255,0.4)';
      this.ringColors[i] = '#ffffff';
    }
  }

  private applyPalette(palette: ColorPalette) {
    const entries = [palette.primary, palette.secondary, palette.accent];
    for (let i = 0; i < NUM_COLORS; i++) {
      const rgb = parseRgb(entries[i]);
      if (rgb) {
        const [r, g, b] = rgb;
        this.colors[i] = `rgba(${r},${g},${b},`;
        this.shadowColors[i] = `rgba(${r},${g},${b},0.4)`;
        this.ringColors[i] = entries[i];
      }
    }
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.canvas.width = w;
    this.canvas.height = h;
    this.fieldCols = Math.ceil(w / CELL_SIZE) + 1;
    this.fieldRows = Math.ceil(h / CELL_SIZE) + 1;
    this.fieldAngles = new Float32Array(this.fieldCols * this.fieldRows);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  // --- Private ---

  private loop = () => {
    if (!this.running) return;
    this.time += 0.01;
    this.readAudio();
    this.updateFlowField();
    this.spawnParticles();
    this.detectBassHits();
    this.updateParticles();
    this.updateRings();
    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  };

  private readAudio() {
    if (!this.analyser || !this.isPlaying) {
      const d = 0.95;
      this.smoothBands.subBass *= d;
      this.smoothBands.bass *= d;
      this.smoothBands.mid *= d;
      this.smoothBands.high *= d;
      return;
    }

    this.analyser.getByteFrequencyData(this.freqData);

    const avg = (start: number, end: number) => {
      let sum = 0;
      for (let i = start; i < end; i++) sum += this.freqData[i];
      return sum / (end - start) / 255;
    };

    const lerp = 0.15;
    this.prevBass = this.smoothBands.bass;
    this.smoothBands.subBass += (avg(...BAND_SUB_BASS) - this.smoothBands.subBass) * lerp;
    this.smoothBands.bass += (avg(...BAND_BASS) - this.smoothBands.bass) * lerp;
    this.smoothBands.mid += (avg(...BAND_MID) - this.smoothBands.mid) * lerp;
    this.smoothBands.high += (avg(...BAND_HIGH) - this.smoothBands.high) * lerp;
  }

  private detectBassHits() {
    if (!this.isPlaying) return;

    const bassNow = this.smoothBands.bass + this.smoothBands.subBass;
    const bassPrev = this.prevBass + this.smoothBands.subBass * 0.8;
    const isThunder = this.mode === 'thunder';
    const threshold = isThunder ? 0.35 : 0.45;
    const cooldown = isThunder ? 8 : 12;

    if (bassNow > threshold && bassNow > bassPrev * 1.15 &&
        this.time - this.lastBassHitTime > cooldown * 0.01) {
      this.lastBassHitTime = this.time;
      this.spawnShockwave(bassNow);
    }
  }

  private spawnShockwave(intensity: number) {
    const cx = this.w * 0.5;
    const cy = this.h * 0.85;

    if (this.rings.length >= MAX_RINGS) {
      this.rings.shift();
    }

    const isThunder = this.mode === 'thunder';
    const maxR = Math.min(this.w, this.h) * (0.3 + intensity * 0.5);

    // Alternate between primary(0) and secondary(1)
    const ci = this.ringColorToggle % 2;
    this.ringColorToggle++;

    this.rings.push({
      x: cx + (Math.random() - 0.5) * this.w * 0.1,
      y: cy + (Math.random() - 0.5) * 30,
      radius: 10,
      maxRadius: maxR,
      alpha: isThunder ? 0.7 + intensity * 0.3 : 0.4 + intensity * 0.3,
      lineWidth: isThunder ? 3 + intensity * 4 : 2 + intensity * 2,
      speed: isThunder ? 6 + intensity * 8 : 3 + intensity * 4,
      color: this.ringColors[ci],
    });

    // Thunder: second ring in the other color
    if (isThunder && intensity > 0.5) {
      this.rings.push({
        x: cx + (Math.random() - 0.5) * this.w * 0.15,
        y: cy + (Math.random() - 0.5) * 40,
        radius: 5,
        maxRadius: maxR * 0.7,
        alpha: 0.5 + intensity * 0.2,
        lineWidth: 2 + intensity * 2,
        speed: 8 + intensity * 6,
        color: this.ringColors[1 - ci],
      });
    }
  }

  private updateRings() {
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];
      ring.radius += ring.speed;
      const progress = ring.radius / ring.maxRadius;
      ring.alpha *= (1 - progress * 0.04);
      ring.lineWidth *= 0.995;

      if (ring.radius >= ring.maxRadius || ring.alpha < 0.01) {
        this.rings.splice(i, 1);
      }
    }
  }

  private updateFlowField() {
    const cfg = CONFIGS[this.mode];
    const scale = cfg.noiseScale;
    const t = this.isPlaying ? this.time : this.time * 0.3;
    const turbulence = 1 + this.smoothBands.mid * 2;

    for (let row = 0; row < this.fieldRows; row++) {
      for (let col = 0; col < this.fieldCols; col++) {
        const nx = col * scale * CELL_SIZE + t;
        const ny = row * scale * CELL_SIZE + t * 0.7;
        this.fieldAngles[row * this.fieldCols + col] = this.noise2D(nx, ny) * Math.PI * turbulence;
      }
    }
  }

  private spawnParticles() {
    const cfg = CONFIGS[this.mode];
    let rate: number;
    let speedMult: number;

    if (this.isPlaying) {
      rate = cfg.spawnRate;
      rate += rate * this.smoothBands.subBass * 3;
      speedMult = 1;

      const subBassRaw = this.smoothBands.subBass * 255;
      if (subBassRaw > cfg.burstThreshold) {
        rate += cfg.burstAmount;
      }
    } else {
      rate = cfg.idleSpawnRate;
      speedMult = cfg.idleSpeedMult;
    }

    const toSpawn = Math.min(Math.floor(rate), MAX_PARTICLES - this.count);
    const cx = this.w * 0.5;
    const spread = this.w * 0.3 * cfg.archSpread;

    for (let i = 0; i < toSpawn; i++) {
      const idx = this.count++;
      this.px[idx] = cx + (Math.random() - 0.5) * spread;
      this.py[idx] = this.h + Math.random() * 10;
      this.vx[idx] = (Math.random() - 0.5) * cfg.baseSpeed * 0.5 * speedMult;
      this.vy[idx] = -cfg.baseSpeed * (0.5 + Math.random() * 0.5) * speedMult;
      const lifeRange = cfg.maxLife[1] - cfg.maxLife[0];
      const lifeMult = this.isPlaying ? 1 : 1.8;
      this.maxLife[idx] = (cfg.maxLife[0] + Math.random() * lifeRange) * lifeMult;
      this.life[idx] = 0;
      this.alpha[idx] = 0;
      this.size[idx] = cfg.sizeRange[0] + Math.random() * (cfg.sizeRange[1] - cfg.sizeRange[0]);

      // Assign color: weighted random (primary 45%, secondary 35%, accent 20%)
      const roll = Math.random();
      this.colorIdx[idx] = roll < COLOR_WEIGHTS[0] ? 0 : roll < COLOR_WEIGHTS[1] ? 1 : 2;
    }
  }

  private updateParticles() {
    const cfg = CONFIGS[this.mode];
    const cx = this.w * 0.5;
    const bassBoost = this.isPlaying ? 1 + this.smoothBands.bass * cfg.bassVelocityMult : 1;
    const highAlpha = this.smoothBands.high;
    const idleAlphaCap = cfg.idleAlphaCap;

    let writeIdx = 0;

    for (let i = 0; i < this.count; i++) {
      this.life[i]++;

      if (this.life[i] >= this.maxLife[i]) continue;

      const lifeRatio = this.life[i] / this.maxLife[i];

      // Flow field lookup
      const col = Math.floor(this.px[i] / CELL_SIZE);
      const row = Math.floor(this.py[i] / CELL_SIZE);
      if (col >= 0 && col < this.fieldCols && row >= 0 && row < this.fieldRows) {
        const angle = this.fieldAngles[row * this.fieldCols + col];
        const strength = this.isPlaying ? cfg.noiseStrength : cfg.noiseStrength * 0.4;
        this.vx[i] += Math.cos(angle) * strength * 0.1;
        this.vy[i] += Math.sin(angle) * strength * 0.1;
      }

      // Arch force
      const dx = this.px[i] - cx;
      const distFromCenter = Math.abs(dx) / (this.w * 0.5);
      const archCurve = Math.sin(distFromCenter * Math.PI * 0.8);
      const archMult = this.isPlaying ? 1 : 0.5;
      this.vy[i] -= cfg.archStrength * archCurve * 0.1 * archMult;
      this.vx[i] += Math.sign(dx) * cfg.archStrength * 0.05 * (1 - distFromCenter) * archMult;

      // Damping
      this.vx[i] *= 0.98;
      this.vy[i] *= 0.98;

      // Position
      this.px[i] += this.vx[i] * bassBoost;
      this.py[i] += this.vy[i] * bassBoost;

      // Alpha envelope
      let a: number;
      if (lifeRatio < 0.1) {
        a = lifeRatio / 0.1;
      } else if (lifeRatio > 0.7) {
        a = (1 - lifeRatio) / 0.3;
      } else {
        a = 1;
      }

      if (this.isPlaying) {
        a *= 0.3 + highAlpha * 0.7 + 0.3;
      } else {
        a *= idleAlphaCap;
      }
      this.alpha[i] = Math.min(1, a);

      this.size[i] += this.smoothBands.bass * 0.02;

      // Out of bounds?
      if (this.px[i] < -50 || this.px[i] > this.w + 50 || this.py[i] < -50) continue;

      // Compact — copy all fields including colorIdx
      if (writeIdx !== i) {
        this.px[writeIdx] = this.px[i];
        this.py[writeIdx] = this.py[i];
        this.vx[writeIdx] = this.vx[i];
        this.vy[writeIdx] = this.vy[i];
        this.life[writeIdx] = this.life[i];
        this.maxLife[writeIdx] = this.maxLife[i];
        this.alpha[writeIdx] = this.alpha[i];
        this.size[writeIdx] = this.size[i];
        this.colorIdx[writeIdx] = this.colorIdx[i];
      }
      writeIdx++;
    }

    this.count = writeIdx;
  }

  private render() {
    const ctx = this.ctx;
    const cfg = CONFIGS[this.mode];

    // Trail clear
    const clearAlpha = this.isPlaying ? cfg.clearAlpha : cfg.idleClearAlpha;
    ctx.fillStyle = `rgba(0,0,0,${clearAlpha})`;
    ctx.fillRect(0, 0, this.w, this.h);

    // --- Shockwave Rings ---
    this.renderRings(ctx);

    // --- Particles: bucket by (alpha x color) ---
    // 4 alpha buckets x 3 color slots = 12 sub-buckets
    const ALPHA_BANDS: [number, number][] = [
      [0, 0.15],
      [0.15, 0.35],
      [0.35, 0.65],
      [0.65, 1.01],
    ];

    // Flat array: [alphaBand0_color0, alphaBand0_color1, alphaBand0_color2, alphaBand1_color0, ...]
    const subBuckets: number[][] = new Array(ALPHA_BANDS.length * NUM_COLORS);
    for (let i = 0; i < subBuckets.length; i++) subBuckets[i] = [];

    for (let i = 0; i < this.count; i++) {
      const a = this.alpha[i];
      const ci = this.colorIdx[i];
      for (let ab = 0; ab < ALPHA_BANDS.length; ab++) {
        if (a >= ALPHA_BANDS[ab][0] && a < ALPHA_BANDS[ab][1]) {
          subBuckets[ab * NUM_COLORS + ci].push(i);
          break;
        }
      }
    }

    // Render each sub-bucket: one fillStyle + globalAlpha per group
    for (let ab = 0; ab < ALPHA_BANDS.length; ab++) {
      const [lo, hi] = ALPHA_BANDS[ab];
      const midAlpha = (lo + hi) / 2;
      const useGlow = lo >= 0.65;

      for (let ci = 0; ci < NUM_COLORS; ci++) {
        const indices = subBuckets[ab * NUM_COLORS + ci];
        if (indices.length === 0) continue;

        ctx.globalAlpha = midAlpha;
        ctx.fillStyle = this.colors[ci] + '1)';

        if (useGlow) {
          ctx.shadowColor = this.shadowColors[ci];
          ctx.shadowBlur = 8;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        for (const idx of indices) {
          const r = this.size[idx];
          ctx.moveTo(this.px[idx] + r, this.py[idx]);
          ctx.arc(this.px[idx], this.py[idx], r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  private renderRings(ctx: CanvasRenderingContext2D) {
    if (this.rings.length === 0) return;

    for (const ring of this.rings) {
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = ring.alpha;
      ctx.lineWidth = ring.lineWidth;
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
  }
}
