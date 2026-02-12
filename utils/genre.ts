import { EnrichedAlbum } from '../types';
import { GenreConfig, GenreZoneConfig, GENRE_CONFIGS } from '../genre-config';

export type GenreZone = 'cloud' | 'crossover' | 'thunder';

// Legacy terms for backward compat when no genreConfig is provided
const THUNDER_TERMS = ['big beat', 'breakbeat', 'progressive breakbeat'];
const CLOUD_TERMS = [
  'trip-hop', 'trip hop', 'downtempo', 'dream pop', 'dub',
  'cinematic', 'synth pop', 'instrumental', 'alternative',
  'proto-trip-hop',
];

// Legacy zone classification (used when no genreConfig provided)
export function classifyGenreZone(album: EnrichedAlbum): GenreZone {
  const genre = album.genre.toLowerCase();

  if (genre.includes('blending')) return 'crossover';

  if (genre.includes('/')) {
    const hasThunder = THUNDER_TERMS.some(t => genre.includes(t));
    const hasCloud = CLOUD_TERMS.some(t => genre.includes(t));
    if (hasThunder && hasCloud) return 'crossover';
  }

  const style = album.genre_style;
  if (style === 'thunder' || style === 'cloud') return style;
  return 'crossover'; // fallback for non-legacy modes (e.g. 'boom')
}

// GenreConfig-based zone classification
export function classifyZone(album: EnrichedAlbum, config: GenreConfig): GenreZoneConfig {
  const genre = album.genre.toLowerCase();

  // Try to match against zone matchTerms
  for (const zone of config.zones) {
    if (zone.matchTerms.some(term => genre.includes(term))) {
      return zone;
    }
  }

  // Default to middle zone
  return config.zones[Math.floor(config.zones.length / 2)];
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

// Legacy zone centers (used when no genreConfig provided)
export const ZONE_CENTERS: Record<GenreZone, number> = {
  cloud: 100,
  crossover: 250,
  thunder: 400,
};

const JITTER_RANGE = 70;

// Legacy vertical offset (used when no genreConfig provided)
export function getVerticalOffset(album: EnrichedAlbum, config?: GenreConfig): number {
  if (config) {
    const zone = classifyZone(album, config);
    return zone.center + deterministicJitter(album.id, JITTER_RANGE);
  }
  const zone = classifyGenreZone(album);
  return ZONE_CENTERS[zone] + deterministicJitter(album.id, JITTER_RANGE);
}

// Get zone color for an album
export function getZoneColor(album: EnrichedAlbum, config?: GenreConfig): { primary: string; glow: string; faded: string } {
  if (config) {
    const zone = classifyZone(album, config);
    return zone.color;
  }
  const zone = classifyGenreZone(album);
  return ZONE_COLORS[zone];
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
