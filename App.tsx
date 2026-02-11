import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fetchEnrichedAlbums } from './services/api';
import { EnrichedAlbum, GenreStyle } from './types';
import Timeline from './components/Timeline';
import GridView from './components/GridView';
import FilterBar from './components/FilterBar';
import Visualizer from './components/Visualizer';
import { extractColors, ColorPalette } from './utils/color-extract';

const App: React.FC = () => {
  const [albums, setAlbums] = useState<EnrichedAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [currentGenre, setCurrentGenre] = useState<GenreStyle>('cloud');
  const [hasStarted, setHasStarted] = useState(false); // To handle Autoplay Policy
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const [activeColors, setActiveColors] = useState<ColorPalette | null>(null);
  
  // Audio Refs
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  // Force update for visualizer to pick up analyzer changes
  const [, setForceUpdate] = useState(0);

  useEffect(() => {
    // 1. Fetch Data
    const init = async () => {
      const data = await fetchEnrichedAlbums();
      setAlbums(data);
      setLoading(false);
    };
    init();

    // Cleanup
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      audioRef.current.pause();
    };
  }, []);

  const initializeAudioContext = () => {
    if (!audioContextRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const actx = new Ctx();
      const analyser = actx.createAnalyser();
      analyser.fftSize = 256;
      
      const source = actx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(actx.destination);

      audioContextRef.current = actx;
      analyserRef.current = analyser;
      sourceRef.current = source;
      
      setForceUpdate(prev => prev + 1); // Trigger re-render to pass analyser to Visualizer
    } else if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

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

  const startExperience = () => {
    initializeAudioContext();
    setHasStarted(true);
  };

  const handlePlay = (url: string, style: GenreStyle) => {
    initializeAudioContext();
    setCurrentGenre(style);

    const found = albums.find(a => a.previewUrl === url);
    if (found) {
      setActiveId(found.id);
      // Extract colors from album artwork
      extractColors(found.artworkUrl).then(setActiveColors);
    }

    if (audioRef.current.src !== url) {
      audioRef.current.crossOrigin = "anonymous";
      audioRef.current.src = url;
    }

    audioRef.current.play().catch(e => {
        console.warn("Playback prevented. User interaction required.", e);
    });
  };

  const handleStop = () => {
    audioRef.current.pause();
    setActiveId(null);
    setActiveColors(null);
  };

  return (
    <div className="relative w-full bg-off-black text-white selection:bg-neon-pink selection:text-black">
      
      {/* Visualizer Background */}
      <Visualizer
        analyser={analyserRef.current}
        genreStyle={currentGenre}
        isPlaying={!!activeId}
        activeColors={activeColors}
      />

      {/* Header / Brand */}
      <header className="fixed top-14 left-6 md:left-10 z-30 mix-blend-difference pointer-events-none">
        <h1 className="font-display text-4xl md:text-6xl leading-none tracking-tighter">
          THE BREAK <br /> & THE HAZE
        </h1>
        <p className="font-mono text-xs md:text-sm mt-2 text-white/60 tracking-widest uppercase">
          90s Sonic Archives [Beta_v1.0]
        </p>
      </header>

      {/* Main Content */}
      <main className="relative z-10 w-full">
        {loading ? (
          <div className="flex items-center justify-center w-full h-screen font-mono text-xs animate-pulse">
            INITIALIZING_DATABASE...
          </div>
        ) : (
          <>
             {/* Start Overlay for Autoplay Policy */}
             {!hasStarted && (
                <div 
                    onClick={startExperience}
                    className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm"
                >
                    <div className="border border-acid-yellow p-8 hover:bg-acid-yellow/10 transition-colors group">
                        <p className="font-display text-2xl md:text-4xl text-white group-hover:text-acid-yellow transition-colors animate-pulse">
                            CLICK TO ENTER
                        </p>
                        <p className="font-mono text-xs text-center mt-4 text-gray-400">
                            ENABLES AUDIO EXPERIENCE
                        </p>
                    </div>
                </div>
             )}

             <FilterBar
                artists={artists}
                selectedArtist={selectedArtist}
                onSelectArtist={handleSelectArtist}
                viewMode={viewMode}
                onChangeView={handleChangeView}
             />

             {viewMode === 'timeline' ? (
               <Timeline
                  albums={filteredAlbums}
                  onPlay={handlePlay}
                  onStop={handleStop}
                  activeId={activeId}
                  activeColors={activeColors}
               />
             ) : (
               <GridView
                  albums={filteredAlbums}
                  onPlay={handlePlay}
                  onStop={handleStop}
                  activeId={activeId}
               />
             )}
          </>
        )}
      </main>

    </div>
  );
};

export default App;
