import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GenreId, getGenreConfig, GENRE_CONFIGS } from '../genre-config';
import { getLocalAlbums, fetchPreviewUrls } from '../services/api';
import { EnrichedAlbum, GenreStyle } from '../types';
import { ColorPalette } from '../utils/color-extract';
import Timeline from '../components/Timeline';
import GridView from '../components/GridView';
import FilterBar from '../components/FilterBar';
import GenreHeader from '../components/GenreHeader';
import BackButton from '../components/BackButton';

interface GenrePageProps {
  onPlay: (url: string, style: GenreStyle, albumId: string, artworkUrl: string) => void;
  onStop: () => void;
  activeId: string | null;
  activeColors: ColorPalette | null;
}

const GenrePage: React.FC<GenrePageProps> = ({ onPlay, onStop, activeId, activeColors }) => {
  const { genreId } = useParams<{ genreId: string }>();
  const navigate = useNavigate();

  const config = useMemo(() => {
    if (genreId && genreId in GENRE_CONFIGS) {
      return getGenreConfig(genreId as GenreId);
    }
    return null;
  }, [genreId]);

  const [albums, setAlbums] = useState<EnrichedAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const abortRef = useRef(false);

  useEffect(() => {
    if (!config) {
      navigate('/', { replace: true });
      return;
    }

    abortRef.current = false;
    setSelectedArtist(null);

    // Phase 1: Instant render with local data
    const localAlbums = getLocalAlbums(config.id);
    setAlbums(localAlbums);
    setLoading(false);

    // Phase 2: Fetch preview URLs in background
    const needsEnrichment = localAlbums.some(a => !a.previewUrl);
    if (needsEnrichment) {
      setEnriching(true);
      fetchPreviewUrls(localAlbums, (updates) => {
        if (abortRef.current) return;
        setAlbums(prev => prev.map(album => {
          const update = updates.get(album.id);
          if (!update) return album;
          return {
            ...album,
            previewUrl: update.previewUrl,
            artworkUrl: update.artworkUrl || album.artworkUrl,
          };
        }));
      }).finally(() => {
        if (!abortRef.current) setEnriching(false);
      });
    }

    return () => { abortRef.current = true; };
  }, [config, navigate]);

  // Stop playback on unmount (route change)
  useEffect(() => {
    return () => onStop();
  }, [onStop]);

  const artists = useMemo(() => {
    return [...new Set(albums.map(a => a.artist))].sort();
  }, [albums]);

  const filteredAlbums = useMemo(() => {
    if (!selectedArtist) return albums;
    return albums.filter(a => a.artist === selectedArtist);
  }, [albums, selectedArtist]);

  const handleSelectArtist = (artist: string | null) => {
    setSelectedArtist(artist);
    window.scrollTo(0, 0);
  };

  const handleChangeView = (mode: 'timeline' | 'grid') => {
    setViewMode(mode);
    window.scrollTo(0, 0);
  };

  if (!config) return null;

  return (
    <>
      <GenreHeader config={config} />
      <BackButton />

      <FilterBar
        artists={artists}
        selectedArtist={selectedArtist}
        onSelectArtist={handleSelectArtist}
        viewMode={viewMode}
        onChangeView={handleChangeView}
        genreConfig={config}
      />

      {loading ? (
        <div className="flex items-center justify-center w-full h-screen font-mono text-xs animate-pulse">
          INITIALIZING_DATABASE...
        </div>
      ) : viewMode === 'timeline' ? (
        <Timeline
          albums={filteredAlbums}
          onPlay={onPlay}
          onStop={onStop}
          activeId={activeId}
          activeColors={activeColors}
          genreConfig={config}
        />
      ) : (
        <GridView
          albums={filteredAlbums}
          onPlay={onPlay}
          onStop={onStop}
          activeId={activeId}
        />
      )}

      {enriching && (
        <div className="fixed bottom-4 right-4 z-50 font-mono text-[10px] text-white/30 tracking-wider animate-pulse">
          LOADING_STREAMS...
        </div>
      )}
    </>
  );
};

export default GenrePage;
