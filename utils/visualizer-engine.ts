import { createNoise2D } from './simplex-noise';
import { ColorPalette } from './color-extract';

type Mode = 'thunder' | 'cloud';

// --- Audio Bands (128 bins from fftSize=256) ---
const BAND_SUB_BASS: [number, number] = [0, 8];
const BAND_BASS: [number, number] = [8, 24];
const BAND_MID: [number, number] = [24, 64];
const BAND_HIGH: [number, number] = [64, 128];

// --- Aurora Blob ---
interface Blob {
  baseX: number;       // normalized 0-1
  baseY: number;
  baseRadius: number;  // normalized to min(w,h)
  radius: number;      // current rendered radius
  color: [number, number, number];
  noiseOffX: number;   // unique noise seed offsets
  noiseOffY: number;
  audioBand: 'subBass' | 'bass' | 'mid'; // which band drives this blob
}

// --- Pulse Ring ---
interface Ring {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  lineWidth: number;
  speed: number;
  color: [number, number, number];
}

const MAX_RINGS = 8;

// --- Dust Particle (spring-based vibration driven by ring wavefronts) ---
const DUST_COUNT = 1500;
const SPRING_K = 0.35;
const SPRING_DAMP = 0.75;
const RING_BAND = 40;

// Parse "rgb(r, g, b)" -> [r,g,b]
function parseRgb(s: string): [number, number, number] {
  const m = s.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  return m ? [+m[1], +m[2], +m[3]] : [255, 255, 255];
}

export class VisualizerEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;

  // Aurora blobs
  private blobs: Blob[] = [];
  private noise2D = createNoise2D(42);

  // Pulse rings
  private rings: Ring[] = [];
  private lastBassHitTime = 0;
  private ringColorToggle = 0;

  // Dust particles (SoA for this small fixed-size pool)
  private dustX = new Float32Array(DUST_COUNT);
  private dustY = new Float32Array(DUST_COUNT);
  private dustRestY = new Float32Array(DUST_COUNT);
  private dustVy = new Float32Array(DUST_COUNT);
  private dustAlpha = new Float32Array(DUST_COUNT);
  private dustSize = new Float32Array(DUST_COUNT);
  private dustColorIdx = new Uint8Array(DUST_COUNT); // 0,1,2 palette index
  private dustInited = false;

  // Audio
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array = new Uint8Array(128);
  private smoothBands = { subBass: 0, bass: 0, mid: 0, high: 0 };
  private prevBass = 0;

  // Colors — [primary, secondary, accent] as RGB tuples
  private palette: ColorPalette | null = null;
  private paletteRgb: [number, number, number][] = [[255, 255, 255], [255, 255, 255], [255, 255, 255]];

  // State
  private mode: Mode = 'cloud';
  private isPlaying = false;
  private time = 0;
  private rafId = 0;
  private running = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.initBlobs();
  }

  private initBlobs() {
    this.blobs = [
      {
        baseX: 0.35, baseY: 0.45, baseRadius: 0.35,
        radius: 0, color: [255, 255, 255],
        noiseOffX: 0, noiseOffY: 100,
        audioBand: 'subBass',
      },
      {
        baseX: 0.65, baseY: 0.40, baseRadius: 0.30,
        radius: 0, color: [255, 255, 255],
        noiseOffX: 200, noiseOffY: 300,
        audioBand: 'bass',
      },
      {
        baseX: 0.50, baseY: 0.70, baseRadius: 0.32,
        radius: 0, color: [255, 255, 255],
        noiseOffX: 400, noiseOffY: 500,
        audioBand: 'mid',
      },
    ];
  }

  setAnalyser(analyser: AnalyserNode | null) {
    this.analyser = analyser;
    if (analyser) {
      this.freqData = new Uint8Array(analyser.frequencyBinCount);
    }
  }

  setMode(mode: Mode) { this.mode = mode; }

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
    const w: [number, number, number] = [255, 255, 255];
    this.paletteRgb = [w, w, w];
    for (const blob of this.blobs) blob.color = w;
  }

  private applyPalette(palette: ColorPalette) {
    const entries = [palette.primary, palette.secondary, palette.accent];
    this.paletteRgb = entries.map(parseRgb) as [number, number, number][];
    // Assign each blob a palette color
    for (let i = 0; i < this.blobs.length; i++) {
      this.blobs[i].color = this.paletteRgb[i % this.paletteRgb.length];
    }
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.canvas.width = w;
    this.canvas.height = h;
    this.initDust();
  }

  private initDust() {
    if (this.w === 0 || this.h === 0) return;
    const centerY = this.h * 0.50;
    for (let i = 0; i < DUST_COUNT; i++) {
      this.dustX[i] = (i / DUST_COUNT) * this.w + (Math.random() - 0.5) * (this.w / DUST_COUNT);
      const restY = centerY + (Math.random() - 0.5) * this.h * 0.12;
      this.dustRestY[i] = restY;
      this.dustY[i] = restY;
      this.dustVy[i] = 0;
      this.dustAlpha[i] = 0.12;
      this.dustSize[i] = 0.5 + Math.random() * 1.2;
      this.dustColorIdx[i] = Math.floor(Math.random() * 3);
    }
    this.dustInited = true;
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

  // --- Loop ---

  private loop = () => {
    if (!this.running) return;
    this.time += 0.01;
    this.readAudio();
    this.detectBassHits();
    this.updateRings();
    this.updateDust();
    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  };

  private readAudio() {
    if (!this.analyser || !this.isPlaying) {
      const d = 0.93;
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

    const lerp = 0.12;
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
    const threshold = isThunder ? 0.30 : 0.40;
    const cooldown = isThunder ? 0.06 : 0.10;

    if (bassNow > threshold && bassNow > bassPrev * 1.12 &&
        this.time - this.lastBassHitTime > cooldown) {
      this.lastBassHitTime = this.time;
      this.spawnRing(bassNow);
    }
  }

  private spawnRing(intensity: number) {
    if (this.rings.length >= MAX_RINGS) this.rings.shift();

    const cx = this.w * 0.5;
    const cy = this.h * 0.55;
    const isThunder = this.mode === 'thunder';
    const maxR = Math.min(this.w, this.h) * (0.25 + intensity * 0.4);

    // Alternate primary/secondary color
    const ci = this.ringColorToggle % 2;
    this.ringColorToggle++;

    this.rings.push({
      x: cx,
      y: cy,
      radius: 5,
      maxRadius: maxR,
      alpha: isThunder ? 0.25 + intensity * 0.15 : 0.12 + intensity * 0.12,
      lineWidth: isThunder ? 2 + intensity * 2.5 : 1 + intensity * 1.5,
      speed: isThunder ? 4 + intensity * 6 : 2 + intensity * 4,
      color: this.paletteRgb[ci],
    });

    // Thunder: second ring with delay feel
    if (isThunder && intensity > 0.45) {
      this.rings.push({
        x: cx,
        y: cy,
        radius: 2,
        maxRadius: maxR * 0.6,
        alpha: 0.15 + intensity * 0.08,
        lineWidth: 1 + intensity * 1,
        speed: 6 + intensity * 5,
        color: this.paletteRgb[1 - ci],
      });
    }
  }

  private updateRings() {
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];
      ring.radius += ring.speed;
      const progress = ring.radius / ring.maxRadius;
      ring.alpha *= (1 - progress * 0.035);
      ring.lineWidth *= 0.997;

      if (ring.radius >= ring.maxRadius || ring.alpha < 0.005) {
        this.rings.splice(i, 1);
      }
    }
  }

  private updateDust() {
    if (!this.dustInited) return;

    const isThunder = this.mode === 'thunder';
    const impulseMult = isThunder ? 2.0 : 1.0;
    const nRings = this.rings.length;
    const t = this.time;

    for (let i = 0; i < DUST_COUNT; i++) {
      let force = 0;

      for (let ri = 0; ri < nRings; ri++) {
        const ring = this.rings[ri];
        const dx = this.dustX[i] - ring.x;
        const dy = this.dustRestY[i] - ring.y;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        const distFromWave = distFromCenter - ring.radius;

        if (Math.abs(distFromWave) < RING_BAND) {
          const proximity = 1 - Math.abs(distFromWave) / RING_BAND;
          // Signed: ahead of wavefront → up, behind → down (symmetric oscillation)
          const sign = distFromWave >= 0 ? 1 : -1;
          force += ring.alpha * ring.speed * proximity * sign * impulseMult;
        }
      }

      // Ambient bass: standing wave pattern (sin across x position + time)
      if (this.isPlaying) {
        const wavePhase = this.dustX[i] * 0.008 + t * 12;
        const bassWave = Math.sin(wavePhase);
        force += bassWave * this.smoothBands.bass * 6 * impulseMult;
        force += bassWave * this.smoothBands.subBass * 10 * impulseMult;
      }

      // Signed displacement: positive = up, negative = down
      const targetOffset = -force * 16;

      // Spring physics: accelerate toward (restY + targetOffset)
      const targetY = this.dustRestY[i] + targetOffset;
      const displacement = targetY - this.dustY[i];
      this.dustVy[i] += displacement * SPRING_K;
      this.dustVy[i] *= SPRING_DAMP;
      this.dustY[i] += this.dustVy[i];

      const lift = Math.abs(this.dustRestY[i] - this.dustY[i]);
      if (lift > 1) {
        this.dustX[i] += (Math.random() - 0.5) * lift * 0.12;
      }

      this.dustAlpha[i] = lift > 3
        ? Math.min(0.9, 0.25 + lift * 0.006)
        : 0.10;
    }
  }

  // --- Render ---

  private render() {
    const ctx = this.ctx;

    // Clear with slight trail for ring afterglow
    const clearAlpha = this.isPlaying
      ? (this.mode === 'thunder' ? 0.18 : 0.10)
      : 0.04;
    ctx.fillStyle = `rgba(0,0,0,${clearAlpha})`;
    ctx.fillRect(0, 0, this.w, this.h);

    // Aurora blobs (behind everything)
    this.renderBlobs(ctx);

    // Dust particles
    this.renderDust(ctx);

    // Pulse rings on top
    this.renderRings(ctx);
  }

  private renderBlobs(ctx: CanvasRenderingContext2D) {
    const scale = Math.min(this.w, this.h);
    const t = this.isPlaying ? this.time : this.time * 0.25;

    // Blending mode: screen gives beautiful color mixing where blobs overlap
    ctx.globalCompositeOperation = 'screen';

    for (const blob of this.blobs) {
      // Drift position with noise
      const driftX = this.noise2D(blob.noiseOffX + t * 0.3, 0) * 0.12;
      const driftY = this.noise2D(0, blob.noiseOffY + t * 0.25) * 0.10;
      const cx = (blob.baseX + driftX) * this.w;
      const cy = (blob.baseY + driftY) * this.h;

      // Audio-driven radius pulse
      const bandValue = this.smoothBands[blob.audioBand];
      const audioPulse = this.isPlaying ? bandValue * 0.25 : 0;
      const breathe = Math.sin(t * 0.8 + blob.noiseOffX) * 0.03; // subtle idle breathing
      const r = (blob.baseRadius + audioPulse + breathe) * scale;

      // Alpha: active vs idle
      const baseAlpha = this.isPlaying
        ? 0.15 + this.smoothBands.high * 0.20 + bandValue * 0.10
        : 0.04 + Math.sin(t * 0.5 + blob.noiseOffX) * 0.015;

      const [cr, cg, cb] = blob.color;

      // Radial gradient: color center fading to transparent
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},${baseAlpha})`);
      grad.addColorStop(0.4, `rgba(${cr},${cg},${cb},${baseAlpha * 0.6})`);
      grad.addColorStop(0.7, `rgba(${cr},${cg},${cb},${baseAlpha * 0.2})`);
      grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  private renderDust(ctx: CanvasRenderingContext2D) {
    if (!this.dustInited) return;

    for (let i = 0; i < DUST_COUNT; i++) {
      const a = this.dustAlpha[i];
      if (a < 0.02) continue;

      const [r, g, b] = this.paletteRgb[this.dustColorIdx[i]];
      const sz = this.dustSize[i];

      ctx.globalAlpha = a;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.arc(this.dustX[i], this.dustY[i], sz, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  private renderRings(ctx: CanvasRenderingContext2D) {
    if (this.rings.length === 0) return;

    for (const ring of this.rings) {
      const [r, g, b] = ring.color;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r},${g},${b},${ring.alpha})`;
      ctx.lineWidth = ring.lineWidth;
      ctx.stroke();
    }
  }
}
