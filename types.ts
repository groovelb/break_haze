import { GenreId, VisualizerMode } from './genre-config';

export type GenreStyle = VisualizerMode;

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
  genreId: GenreId;
  albums: RawAlbumData[];
}

export interface EnrichedAlbum extends RawAlbumData {
  artist: string;
  genre: string;
  genre_style: GenreStyle;
  genreId: GenreId;
  artworkUrl: string;
  previewUrl: string | null;
  itunesLink: string | null;
  id: string;
}

export interface AudioContextState {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  gainNode: GainNode | null;
}
