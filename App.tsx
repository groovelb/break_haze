import React, { useState, useRef, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { GenreStyle } from './types';
import Visualizer from './components/Visualizer';
import { extractColors, ColorPalette } from './utils/color-extract';
import LandingPage from './pages/LandingPage';
import GenrePage from './pages/GenrePage';

const App: React.FC = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [currentGenre, setCurrentGenre] = useState<GenreStyle>('cloud');
  const [activeColors, setActiveColors] = useState<ColorPalette | null>(null);

  // Audio Refs
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [, setForceUpdate] = useState(0);

  const initializeAudioContext = useCallback(() => {
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

      setForceUpdate(prev => prev + 1);
    } else if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const handlePlay = useCallback((url: string, style: GenreStyle, albumId: string, artworkUrl: string) => {
    initializeAudioContext();
    setCurrentGenre(style);
    setActiveId(albumId);
    // Use 100x100 artwork for faster color extraction (64x64 canvas doesn't need 600x600)
    const smallArtwork = artworkUrl.replace('600x600bb', '100x100bb');
    extractColors(smallArtwork).then(setActiveColors);

    if (audioRef.current.src !== url) {
      audioRef.current.crossOrigin = "anonymous";
      audioRef.current.src = url;
    }

    audioRef.current.play().catch(e => {
      console.warn("Playback prevented. User interaction required.", e);
    });
  }, [initializeAudioContext]);

  const handleStop = useCallback(() => {
    audioRef.current.pause();
    setActiveId(null);
    setActiveColors(null);
  }, []);

  return (
    <div className="relative w-full bg-off-black text-white selection:bg-neon-pink selection:text-black">
      <Visualizer
        analyser={analyserRef.current}
        genreStyle={currentGenre}
        isPlaying={!!activeId}
        activeColors={activeColors}
      />

      <main className="relative z-10 w-full">
        <Routes>
          <Route path="/" element={
            <LandingPage onInitAudio={initializeAudioContext} />
          } />
          <Route path="/genre/:genreId" element={
            <GenrePage
              onPlay={handlePlay}
              onStop={handleStop}
              activeId={activeId}
              activeColors={activeColors}
            />
          } />
        </Routes>
      </main>
    </div>
  );
};

export default App;
