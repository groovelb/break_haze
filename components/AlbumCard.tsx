import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { EnrichedAlbum } from '../types';
import { getZoneColor } from '../utils/genre';

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  birth: number;
}

interface AlbumCardProps {
  album: EnrichedAlbum;
  onPlay: (url: string, style: 'thunder' | 'cloud', albumId: string, artworkUrl: string) => void;
  onStop: () => void;
  activeId: string | null;
  variant?: 'timeline' | 'grid';
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album, onPlay, onStop, activeId, variant = 'timeline' }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const rafRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const [isHovered, setIsHovered] = useState(false);
  const isActive = activeId === album.id;
  const zoneColor = useMemo(() => getZoneColor(album), [album]);

  const spawnRipple = useCallback((canvas: HTMLCanvasElement) => {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxR = Math.hypot(cx, cy);
    ripplesRef.current.push({
      x: cx, y: cy,
      radius: 0,
      maxRadius: maxR,
      opacity: 0.6,
      birth: performance.now(),
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = performance.now();

      ripplesRef.current = ripplesRef.current.filter(r => r.opacity > 0.01);

      for (const r of ripplesRef.current) {
        const age = (now - r.birth) / 1000;
        const speed = 180;
        r.radius = age * speed;
        r.opacity = Math.max(0, 0.6 * (1 - r.radius / r.maxRadius));

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${r.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isActive) {
      spawnRipple(canvas);
      intervalRef.current = setInterval(() => spawnRipple(canvas), 800);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, spawnRipple]);

  // Preload audio on hover for instant playback
  const preloadRef = useRef<HTMLAudioElement | null>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (album.previewUrl) {
      // Start preloading immediately
      if (!preloadRef.current || preloadRef.current.src !== album.previewUrl) {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';
        audio.src = album.previewUrl;
        preloadRef.current = audio;
      }
      onPlay(album.previewUrl, album.genre_style, album.id, album.artworkUrl);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onStop();
  };

  return (
    <div
      ref={cardRef}
      className={`relative transition-all duration-500 group select-none ${
        variant === 'grid'
          ? 'w-full z-10'
          : 'w-full z-10'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Vinyl/Case Wrapper */}
      <div
        className={`relative aspect-square border-2 overflow-hidden transition-all duration-300 isolate ${isHovered || isActive ? '' : 'border-neutral-800'}`}
        style={isHovered || isActive ? {
          borderColor: zoneColor.primary,
          boxShadow: `0 0 20px ${zoneColor.glow}, inset 0 0 20px ${zoneColor.faded}`,
        } : undefined}
      >
        
        {/* Image */}
        <img
          src={album.artworkUrl}
          alt={album.title}
          className={`w-full h-full object-cover transition-all duration-700 
            ${isHovered || isActive ? 'grayscale-0 contrast-100' : 'grayscale contrast-125 brightness-75'}
          `}
          draggable={false}
        />

        {/* Glitch Overlay on Hover */}
        {(isHovered || isActive) && (
          <>
             <div className="absolute inset-0 opacity-10 mix-blend-screen animate-pulse pointer-events-none" style={{ backgroundColor: zoneColor.primary }} />
             <div className="absolute top-0 left-0 w-full h-2 animate-glitch-skew pointer-events-none" style={{ backgroundColor: `${zoneColor.primary}80` }} />
          </>
        )}

        {/* Ripple Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      </div>

      {/* Info */}
      <div className="mt-4 font-mono text-xs uppercase tracking-widest relative">
<h3 className={`text-xl font-bold font-display leading-none mb-1 transition-colors ${isHovered ? 'text-white' : 'text-gray-500'}`}>
          {album.title}
        </h3>
        <p className={`${isHovered ? 'text-white' : 'text-gray-600'}`}>
            {album.artist}
        </p>
        <div className="flex justify-between mt-2 text-gray-500 text-[10px]">
            <span>{album.year}</span>
            <span>{album.genre}</span>
        </div>
        {album.key_track && (
             <div className={`mt-2 text-[10px] border border-gray-800 px-2 py-1 inline-block ${isActive ? 'bg-white text-black' : 'text-gray-600'}`}>
                TRACK: {album.key_track}
             </div>
        )}
      </div>
    </div>
  );
};

export default AlbumCard;
