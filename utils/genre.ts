import { EnrichedAlbum } from '../types';

export type GenreZone = 'cloud' | 'crossover' | 'thunder';

const THUNDER_TERMS = ['big beat', 'breakbeat', 'progressive breakbeat'];
const CLOUD_TERMS = [
  'trip-hop', 'trip hop', 'downtempo', 'dream pop', 'dub',
  'cinematic', 'synth pop', 'instrumental', 'alternative',
  'proto-trip-hop',
];

export function classifyGenreZone(album: EnrichedAlbum): GenreZone {
  const genre = album.genre.toLowerCase();

  if (genre.includes('blending')) return 'crossover';

  if (genre.includes('/')) {
    const hasThunder = THUNDER_TERMS.some(t => genre.includes(t));
    const hasCloud = CLOUD_TERMS.some(t => genre.includes(t));
    if (hasThunder && hasCloud) return 'crossover';
  }

  return album.genre_style;
}

export function deterministicJitter(id: string, range: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash;
  }
  const normalized = ((hash % 1000) + 1000) % 1000;
  return (normalized / 999) * range - range / 2;
}

export const ZONE_CENTERS: Record<GenreZone, number> = {
  cloud: 100,
  crossover: 250,
  thunder: 400,
};

const JITTER_RANGE = 70;

export function getVerticalOffset(album: EnrichedAlbum): number {
  const zone = classifyGenreZone(album);
  return ZONE_CENTERS[zone] + deterministicJitter(album.id, JITTER_RANGE);
}

export const ZONE_COLORS: Record<GenreZone, { primary: string; glow: string; faded: string }> = {
  cloud: {
    primary: '#a855f7',
    glow: 'rgba(168,85,247,0.3)',
    faded: 'rgba(168,85,247,0.15)',
  },
  crossover: {
    primary: '#ffffff',
    glow: 'rgba(255,255,255,0.2)',
    faded: 'rgba(255,255,255,0.1)',
  },
  thunder: {
    primary: '#ccff00',
    glow: 'rgba(204,255,0,0.3)',
    faded: 'rgba(204,255,0,0.05)',
  },
};
