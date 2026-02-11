export type GenreStyle = 'thunder' | 'cloud';

export interface RawAlbumData {
  year: number;
  title: string;
  key_track: string;
  search_query: string;
  artworkUrl?: string | null;
  itunesLink?: string | null;
}

export interface ArtistGroup {
  artist: string;
  genre: string;
  genre_style: GenreStyle;
  albums: RawAlbumData[];
}

export interface EnrichedAlbum extends RawAlbumData {
  artist: string;
  genre: string;
  genre_style: GenreStyle;
  artworkUrl: string;
  previewUrl: string | null;
  itunesLink: string | null;
  id: string; // Unique ID for keying
}

export interface AudioContextState {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  gainNode: GainNode | null;
}
