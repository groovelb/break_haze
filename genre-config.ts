export type GenreId =
  | 'big-beat'
  | 'trip-hop'
  | 'acid-house'
  | 'uk-garage'
  | 'jungle-dnb'
  | 'ambient-idm'
  | 'trance'
  | 'breakbeat-hardcore'
  | 'boombap';

export type VisualizerMode = 'thunder' | 'cloud' | 'boom';

export interface GenreColors {
  primary: string;
  secondary: string;
  glow: string;
  faded: string;
  gradient: string;
  bgTint: string;
}

export interface GenreZoneConfig {
  id: string;
  label: string;
  center: number;
  color: { primary: string; glow: string; faded: string };
  matchTerms: string[];
}

export interface GenreConfig {
  id: GenreId;
  name: string;
  tagline: string;
  era: string;
  visualizerMode: VisualizerMode;
  colors: GenreColors;
  zones: GenreZoneConfig[];
}

export const GENRE_CONFIGS: Record<GenreId, GenreConfig> = {
  'big-beat': {
    id: 'big-beat',
    name: 'Big Beat',
    tagline: 'MAXIMUM BREAKBEAT PRESSURE',
    era: '1994 - 2002',
    visualizerMode: 'thunder',
    colors: {
      primary: '#ccff00',
      secondary: '#ff0099',
      glow: 'rgba(204,255,0,0.3)',
      faded: 'rgba(204,255,0,0.05)',
      gradient: 'linear-gradient(135deg, #1a1a00 0%, #333300 40%, #0a0a0a 100%)',
      bgTint: 'rgba(204,255,0,0.02)',
    },
    zones: [
      {
        id: 'breakbeat',
        label: 'BREAKBEAT',
        center: 100,
        color: { primary: '#ff6600', glow: 'rgba(255,102,0,0.3)', faded: 'rgba(255,102,0,0.15)' },
        matchTerms: ['breakbeat', 'sample-based breakbeat'],
      },
      {
        id: 'big-beat',
        label: 'BIG BEAT',
        center: 250,
        color: { primary: '#ccff00', glow: 'rgba(204,255,0,0.3)', faded: 'rgba(204,255,0,0.15)' },
        matchTerms: ['big beat', 'big beat / house'],
      },
      {
        id: 'progressive',
        label: 'PROGRESSIVE',
        center: 400,
        color: { primary: '#ff0099', glow: 'rgba(255,0,153,0.3)', faded: 'rgba(255,0,153,0.15)' },
        matchTerms: ['progressive breakbeat', 'progressive'],
      },
    ],
  },
  'trip-hop': {
    id: 'trip-hop',
    name: 'Trip-Hop',
    tagline: 'SMOKE & FREQUENCIES',
    era: '1991 - 2011',
    visualizerMode: 'cloud',
    colors: {
      primary: '#a855f7',
      secondary: '#6366f1',
      glow: 'rgba(168,85,247,0.3)',
      faded: 'rgba(168,85,247,0.05)',
      gradient: 'linear-gradient(135deg, #0d001a 0%, #240046 40%, #050505 100%)',
      bgTint: 'rgba(168,85,247,0.02)',
    },
    zones: [
      {
        id: 'cloud',
        label: 'CLOUD',
        center: 100,
        color: { primary: '#a855f7', glow: 'rgba(168,85,247,0.3)', faded: 'rgba(168,85,247,0.15)' },
        matchTerms: ['trip-hop', 'trip hop', 'downtempo', 'dream pop', 'cinematic', 'proto-trip-hop'],
      },
      {
        id: 'crossover',
        label: 'CROSS',
        center: 250,
        color: { primary: '#ffffff', glow: 'rgba(255,255,255,0.2)', faded: 'rgba(255,255,255,0.1)' },
        matchTerms: ['blending', 'instrumental', 'alternative', 'synth pop'],
      },
      {
        id: 'thunder',
        label: 'THUNDER',
        center: 400,
        color: { primary: '#ccff00', glow: 'rgba(204,255,0,0.3)', faded: 'rgba(204,255,0,0.05)' },
        matchTerms: ['big beat', 'breakbeat', 'progressive breakbeat'],
      },
    ],
  },
  'acid-house': {
    id: 'acid-house',
    name: 'Acid House',
    tagline: 'ROLAND TB-303 WORSHIP',
    era: '1986 - 1997',
    visualizerMode: 'thunder',
    colors: {
      primary: '#ffff00',
      secondary: '#ff6600',
      glow: 'rgba(255,255,0,0.3)',
      faded: 'rgba(255,255,0,0.05)',
      gradient: 'linear-gradient(135deg, #1a1a00 0%, #332b00 40%, #0a0a0a 100%)',
      bgTint: 'rgba(255,255,0,0.02)',
    },
    zones: [
      { id: 'acid', label: 'ACID', center: 100, color: { primary: '#ffff00', glow: 'rgba(255,255,0,0.3)', faded: 'rgba(255,255,0,0.15)' }, matchTerms: ['acid house', 'acid'] },
      { id: 'house', label: 'HOUSE', center: 250, color: { primary: '#ff6600', glow: 'rgba(255,102,0,0.3)', faded: 'rgba(255,102,0,0.15)' }, matchTerms: ['house', 'chicago house'] },
      { id: 'techno', label: 'TECHNO', center: 400, color: { primary: '#ffcc00', glow: 'rgba(255,204,0,0.3)', faded: 'rgba(255,204,0,0.15)' }, matchTerms: ['techno', 'detroit techno'] },
    ],
  },
  'uk-garage': {
    id: 'uk-garage',
    name: 'UK Garage',
    tagline: '2-STEP VELOCITY',
    era: '1994 - 2004',
    visualizerMode: 'thunder',
    colors: {
      primary: '#c0c0c0',
      secondary: '#e0e0e0',
      glow: 'rgba(192,192,192,0.3)',
      faded: 'rgba(192,192,192,0.05)',
      gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 40%, #050505 100%)',
      bgTint: 'rgba(192,192,192,0.02)',
    },
    zones: [
      { id: 'speed-garage', label: 'SPEED', center: 100, color: { primary: '#e0e0e0', glow: 'rgba(224,224,224,0.3)', faded: 'rgba(224,224,224,0.15)' }, matchTerms: ['speed garage'] },
      { id: '2-step', label: '2-STEP', center: 250, color: { primary: '#c0c0c0', glow: 'rgba(192,192,192,0.3)', faded: 'rgba(192,192,192,0.15)' }, matchTerms: ['2-step', 'uk garage'] },
      { id: 'grime', label: 'GRIME', center: 400, color: { primary: '#808080', glow: 'rgba(128,128,128,0.3)', faded: 'rgba(128,128,128,0.15)' }, matchTerms: ['grime', 'dubstep'] },
    ],
  },
  'jungle-dnb': {
    id: 'jungle-dnb',
    name: 'Jungle / DnB',
    tagline: 'AMEN BREAK MUTATIONS',
    era: '1991 - 2003',
    visualizerMode: 'thunder',
    colors: {
      primary: '#ff6600',
      secondary: '#cc3300',
      glow: 'rgba(255,102,0,0.3)',
      faded: 'rgba(255,102,0,0.05)',
      gradient: 'linear-gradient(135deg, #1a0800 0%, #331500 40%, #0a0a0a 100%)',
      bgTint: 'rgba(255,102,0,0.02)',
    },
    zones: [
      { id: 'jungle', label: 'JUNGLE', center: 100, color: { primary: '#ff6600', glow: 'rgba(255,102,0,0.3)', faded: 'rgba(255,102,0,0.15)' }, matchTerms: ['jungle', 'ragga jungle'] },
      { id: 'liquid', label: 'LIQUID', center: 250, color: { primary: '#ff9933', glow: 'rgba(255,153,51,0.3)', faded: 'rgba(255,153,51,0.15)' }, matchTerms: ['liquid', 'liquid dnb'] },
      { id: 'neurofunk', label: 'NEURO', center: 400, color: { primary: '#cc3300', glow: 'rgba(204,51,0,0.3)', faded: 'rgba(204,51,0,0.15)' }, matchTerms: ['neurofunk', 'drum and bass', 'techstep'] },
    ],
  },
  'ambient-idm': {
    id: 'ambient-idm',
    name: 'Ambient / IDM',
    tagline: 'DRIFT STATE PROTOCOLS',
    era: '1990 - 2004',
    visualizerMode: 'cloud',
    colors: {
      primary: '#00ffff',
      secondary: '#0088ff',
      glow: 'rgba(0,255,255,0.3)',
      faded: 'rgba(0,255,255,0.05)',
      gradient: 'linear-gradient(135deg, #000d0d 0%, #001a2e 40%, #050505 100%)',
      bgTint: 'rgba(0,255,255,0.02)',
    },
    zones: [
      { id: 'ambient', label: 'AMBIENT', center: 100, color: { primary: '#00ffff', glow: 'rgba(0,255,255,0.3)', faded: 'rgba(0,255,255,0.15)' }, matchTerms: ['ambient', 'dark ambient'] },
      { id: 'idm', label: 'IDM', center: 250, color: { primary: '#0088ff', glow: 'rgba(0,136,255,0.3)', faded: 'rgba(0,136,255,0.15)' }, matchTerms: ['idm', 'intelligent dance music', 'glitch'] },
      { id: 'experimental', label: 'EXP', center: 400, color: { primary: '#00ccaa', glow: 'rgba(0,204,170,0.3)', faded: 'rgba(0,204,170,0.15)' }, matchTerms: ['experimental', 'electronica'] },
    ],
  },
  'trance': {
    id: 'trance',
    name: 'Trance',
    tagline: 'EUPHORIC ASCENSION',
    era: '1993 - 2004',
    visualizerMode: 'thunder',
    colors: {
      primary: '#0066ff',
      secondary: '#00ccff',
      glow: 'rgba(0,102,255,0.3)',
      faded: 'rgba(0,102,255,0.05)',
      gradient: 'linear-gradient(135deg, #000a1a 0%, #001133 40%, #050505 100%)',
      bgTint: 'rgba(0,102,255,0.02)',
    },
    zones: [
      { id: 'progressive-trance', label: 'PROG', center: 100, color: { primary: '#0066ff', glow: 'rgba(0,102,255,0.3)', faded: 'rgba(0,102,255,0.15)' }, matchTerms: ['progressive trance'] },
      { id: 'uplifting', label: 'UPLIFT', center: 250, color: { primary: '#00ccff', glow: 'rgba(0,204,255,0.3)', faded: 'rgba(0,204,255,0.15)' }, matchTerms: ['uplifting', 'vocal trance', 'trance'] },
      { id: 'psytrance', label: 'PSY', center: 400, color: { primary: '#9933ff', glow: 'rgba(153,51,255,0.3)', faded: 'rgba(153,51,255,0.15)' }, matchTerms: ['psytrance', 'goa trance'] },
    ],
  },
  'breakbeat-hardcore': {
    id: 'breakbeat-hardcore',
    name: 'Breakbeat Hardcore',
    tagline: 'RAVE GENESIS',
    era: '1989 - 1995',
    visualizerMode: 'thunder',
    colors: {
      primary: '#ff00ff',
      secondary: '#ff66cc',
      glow: 'rgba(255,0,255,0.3)',
      faded: 'rgba(255,0,255,0.05)',
      gradient: 'linear-gradient(135deg, #1a001a 0%, #33004d 40%, #0a0a0a 100%)',
      bgTint: 'rgba(255,0,255,0.02)',
    },
    zones: [
      { id: 'hardcore', label: 'HARDCORE', center: 100, color: { primary: '#ff00ff', glow: 'rgba(255,0,255,0.3)', faded: 'rgba(255,0,255,0.15)' }, matchTerms: ['hardcore', 'breakbeat hardcore'] },
      { id: 'happy-hardcore', label: 'HAPPY', center: 250, color: { primary: '#ff66cc', glow: 'rgba(255,102,204,0.3)', faded: 'rgba(255,102,204,0.15)' }, matchTerms: ['happy hardcore'] },
      { id: 'gabber', label: 'GABBER', center: 400, color: { primary: '#cc0066', glow: 'rgba(204,0,102,0.3)', faded: 'rgba(204,0,102,0.15)' }, matchTerms: ['gabber', 'industrial hardcore'] },
    ],
  },
  'boombap': {
    id: 'boombap',
    name: 'Boombap',
    tagline: 'DRUM BREAK SCRIPTURE',
    era: '1988 - Present',
    visualizerMode: 'boom',
    colors: {
      primary: '#8B0000',
      secondary: '#CD853F',
      glow: 'rgba(139,0,0,0.3)',
      faded: 'rgba(139,0,0,0.05)',
      gradient: 'linear-gradient(135deg, #1a0000 0%, #3d0000 40%, #0a0a0a 100%)',
      bgTint: 'rgba(139,0,0,0.02)',
    },
    zones: [
      {
        id: 'east',
        label: 'EAST',
        center: 100,
        color: { primary: '#8B0000', glow: 'rgba(139,0,0,0.3)', faded: 'rgba(139,0,0,0.15)' },
        matchTerms: ['boom-bap', 'east coast', 'hardcore rap', 'nyc rap', 'boom bap'],
      },
      {
        id: 'soul',
        label: 'SOUL',
        center: 250,
        color: { primary: '#CD853F', glow: 'rgba(205,133,63,0.3)', faded: 'rgba(205,133,63,0.15)' },
        matchTerms: ['jazz rap', 'conscious', 'soulful', 'neo-soul', 'conscious rap'],
      },
      {
        id: 'ug',
        label: 'UG',
        center: 400,
        color: { primary: '#4A0404', glow: 'rgba(74,4,4,0.3)', faded: 'rgba(74,4,4,0.15)' },
        matchTerms: ['underground', 'abstract', 'experimental', 'lo-fi', 'abstract hip-hop'],
      },
    ],
  },
};

export function getGenreConfig(id: GenreId): GenreConfig {
  return GENRE_CONFIGS[id];
}

export function getAllGenres(): GenreConfig[] {
  return Object.values(GENRE_CONFIGS);
}

export const GENRE_ORDER: GenreId[] = [
  'big-beat',
  'trip-hop',
  'boombap',
  'acid-house',
  'uk-garage',
  'jungle-dnb',
  'ambient-idm',
  'trance',
  'breakbeat-hardcore',
];
