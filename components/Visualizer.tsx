import React, { useRef, useEffect } from 'react';
import { GenreStyle } from '../types';
import { VisualizerEngine } from '../utils/visualizer-engine';
import { ColorPalette } from '../utils/color-extract';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  genreStyle: GenreStyle;
  isPlaying: boolean;
  activeColors: ColorPalette | null;
}

const Visualizer: React.FC<VisualizerProps> = ({ analyser, genreStyle, isPlaying, activeColors }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<VisualizerEngine | null>(null);

  // Initialize engine on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new VisualizerEngine(canvas);
    engineRef.current = engine;

    const resize = () => {
      engine.resize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', resize);
    resize();
    engine.start();

    return () => {
      window.removeEventListener('resize', resize);
      engine.stop();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setAnalyser(analyser);
  }, [analyser]);

  useEffect(() => {
    engineRef.current?.setMode(genreStyle);
  }, [genreStyle]);

  useEffect(() => {
    engineRef.current?.setPlaying(isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    engineRef.current?.setColors(activeColors);
  }, [activeColors]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ willChange: 'transform' }}
    />
  );
};

export default Visualizer;
