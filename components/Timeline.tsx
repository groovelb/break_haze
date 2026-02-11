import React, { useLayoutEffect, useRef, useMemo } from 'react';
import { EnrichedAlbum } from '../types';
import AlbumCard from './AlbumCard';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface TimelineProps {
  albums: EnrichedAlbum[];
  onPlay: (url: string, style: 'thunder' | 'cloud') => void;
  onStop: () => void;
  activeId: string | null;
}

const Timeline: React.FC<TimelineProps> = ({ albums, onPlay, onStop, activeId }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || albums.length === 0) return;

    const scrollDistance = track.scrollWidth - window.innerWidth;
    if (scrollDistance <= 0) return;

    ctxRef.current = gsap.context(() => {
      gsap.to(track, {
        x: -scrollDistance,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 1,
          start: 'top top',
          end: () => `+=${scrollDistance}`,
          invalidateOnRefresh: true,
        },
      });
    });

    return () => {
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
  }, [albums]);

  // Unique sorted years that actually have albums — even spacing, no dead gaps
  const activeYears = useMemo(() => {
    return [...new Set(albums.map(a => a.year))].sort((a, b) => a - b);
  }, [albums]);

  // Map year -> percent position (index-based, evenly distributed)
  const yearToPercent = useMemo(() => {
    const map: Record<number, number> = {};
    const count = activeYears.length;
    if (count <= 1) {
      activeYears.forEach(y => map[y] = 50);
    } else {
      activeYears.forEach((y, i) => {
        map[y] = (i / (count - 1)) * 100;
      });
    }
    return map;
  }, [activeYears]);

  // Compute stagger index for albums sharing the same year
  const albumsWithStagger = useMemo(() => {
    const yearCount: Record<number, number> = {};
    return albums.map((album) => {
      const idx = yearCount[album.year] || 0;
      yearCount[album.year] = idx + 1;
      return { album, staggerIndex: idx };
    });
  }, [albums]);

  return (
    <section ref={sectionRef} className="relative w-full h-screen overflow-hidden flex flex-col justify-center">

      {/* Background Parallax Years (Ambient) */}
      <div className="absolute top-1/4 left-0 w-[400vw] h-1/2 flex items-center pointer-events-none opacity-10 select-none z-0">
         {years.filter((_, i) => i % 2 === 0).map((year) => (
             <span key={`bg-${year}`} className="text-[20vw] font-display font-bold text-gray-800 mr-[20vw] whitespace-nowrap">
                 {year}
             </span>
         ))}
      </div>

      {/* Horizontal Track (moved by ScrollTrigger) */}
      <div
        ref={trackRef}
        className="flex items-center h-[600px] px-[10vw] relative z-10 will-change-transform"
      >
        {albums.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            onPlay={onPlay}
            onStop={onStop}
            activeId={activeId}
          />
        ))}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-32 left-10 md:left-20 z-40 text-xs font-mono text-gray-500 pointer-events-none">
         <p>SCROLL <span className="text-acid-yellow">↓</span></p>
         <p>HOVER <span className="text-neon-pink">●</span></p>
      </div>

      {/* BOTTOM VISUAL TIMELINE */}
      <div className="absolute bottom-0 left-0 w-full h-52 bg-gradient-to-t from-black from-60% via-black/70 to-transparent z-40 flex items-end px-10 pb-4 select-none pointer-events-none">
          <div className="relative w-full h-32">

              {/* Timeline Line */}
              <div className="absolute bottom-6 left-0 w-full h-px bg-gray-800" />

              {/* Year Ticks */}
              {years.map((year) => {
                  const percent = ((year - minYear) / (maxYear - minYear)) * 100;
                  return (
                      <div
                        key={`tick-${year}`}
                        className="absolute bottom-0 flex flex-col items-center -translate-x-1/2"
                        style={{ left: `${percent}%` }}
                      >
                          <span className="text-[10px] font-mono text-gray-600">{year}</span>
                      </div>
                  );
              })}

              {/* Album Markers with Labels */}
              {albumsWithStagger.map(({ album, staggerIndex }) => {
                  const percent = ((album.year - minYear) / (maxYear - minYear)) * 100;
                  const isActive = activeId === album.id;
                  const connectorHeight = 16 + staggerIndex * 18;

                  return (
                      <div
                        key={`marker-${album.id}`}
                        className="absolute -translate-x-1/2"
                        style={{ left: `${percent}%`, bottom: 24 }}
                      >
                          {/* Dot on timeline */}
                          <div className={`w-2 h-2 rounded-full transition-all duration-300 mx-auto
                              ${isActive
                                  ? 'bg-white w-2.5 h-2.5 shadow-[0_0_10px_rgba(255,255,255,0.6)]'
                                  : 'bg-gray-600'
                              }
                          `} />

                          {/* Connector line going up */}
                          <div
                            className={`w-px mx-auto transition-colors duration-300 ${isActive ? 'bg-acid-yellow/60' : 'bg-gray-800'}`}
                            style={{ height: connectorHeight, marginTop: -2 - connectorHeight - 8 }}
                          />

                          {/* Label */}
                          <div
                            className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-acid-yellow' : 'text-gray-600'}`}
                            style={{ bottom: 10 + connectorHeight }}
                          >
                              <p className="text-[9px] font-mono leading-tight text-center">{album.artist}</p>
                              <p className={`text-[8px] font-mono leading-tight text-center ${isActive ? 'text-white' : 'text-gray-700'}`}>{album.title}</p>
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>

    </section>
  );
};

export default Timeline;
