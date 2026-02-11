import React, { useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { EnrichedAlbum } from '../types';
import AlbumCard from './AlbumCard';
import { ColorPalette } from '../utils/color-extract';
import { getVerticalOffset, classifyGenreZone, ZONE_COLORS } from '../utils/genre';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface TimelineProps {
  albums: EnrichedAlbum[];
  onPlay: (url: string, style: 'thunder' | 'cloud') => void;
  onStop: () => void;
  activeId: string | null;
  activeColors: ColorPalette | null;
}

const Timeline: React.FC<TimelineProps> = ({ albums, onPlay, onStop, activeId, activeColors }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || albums.length === 0) return;

    const getScrollDistance = () => Math.max(0, track.scrollWidth - window.innerWidth);

    ctxRef.current = gsap.context(() => {
      gsap.to(track, {
        x: () => -getScrollDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 1,
          start: 'top top',
          end: () => `+=${getScrollDistance()}`,
          invalidateOnRefresh: true,
        },
      });
    });

    // Refresh after layout stabilizes (CSS/images/fonts)
    const rafId = requestAnimationFrame(() => ScrollTrigger.refresh());
    const timer = setTimeout(() => ScrollTrigger.refresh(), 500);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
  }, [albums]);

  // Unique sorted years that actually have albums — even spacing, no dead gaps
  const activeYears = useMemo(() => {
    const years = albums.map(a => a.year);
    return [...new Set<number>(years)].sort((a, b) => a - b);
  }, [albums]);

  // Per-album percent position (index-based, evenly distributed)
  const albumPercent = useCallback(
    (index: number) => albums.length <= 1 ? 50 : (index / (albums.length - 1)) * 100,
    [albums.length]
  );

  // Year tick positions — placed at the first album of each year
  const yearTickPositions = useMemo(() => {
    return activeYears.map((year) => {
      const firstIdx = albums.findIndex(a => a.year === year);
      return { year, percent: albumPercent(firstIdx) };
    });
  }, [activeYears, albums, albumPercent]);

  return (
    <section ref={sectionRef} className="relative w-full h-screen overflow-hidden">

      {/* Background Parallax Years (Ambient) */}
      <div className="absolute top-1/4 left-0 w-[400vw] h-1/2 flex items-center pointer-events-none opacity-10 select-none z-0">
         {activeYears.filter((_, i) => i % 2 === 0).map((year) => (
             <span key={`bg-${year}`} className="text-[20vw] font-display font-bold text-gray-800 mr-[20vw] whitespace-nowrap">
                 {year}
             </span>
         ))}
      </div>

      {/* Genre Zone Gradients */}
      <div className="absolute inset-0 z-[5] pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-2/5" style={{ background: 'linear-gradient(to bottom, rgba(36,0,70,0.12), transparent)' }} />
        <div className="absolute bottom-40 left-0 w-full h-2/5" style={{ background: 'linear-gradient(to top, rgba(204,255,0,0.04), transparent)' }} />
      </div>

      {/* ═══ Centered Content Wrapper (absolute positioned, centered with top+translate) ═══ */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[800px]">

        {/* Y-Axis: Frequency Spectrum Indicator */}
        <div className="absolute left-5 top-0 bottom-0 z-20 pointer-events-none">
          {/* Vertical gradient bar */}
          <div className="absolute top-[60px] bottom-[360px] w-px" style={{ background: 'linear-gradient(to bottom, #a855f7 0%, rgba(255,255,255,0.15) 50%, #ccff00 100%)' }} />

          {/* Cloud zone label */}
          <div className="absolute flex items-center gap-2" style={{ top: 100 }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#a855f7', boxShadow: '0 0 6px rgba(168,85,247,0.5)' }} />
            <span className="text-[8px] font-mono tracking-[0.2em] whitespace-nowrap" style={{ color: 'rgba(168,85,247,0.5)' }}>CLOUD</span>
          </div>

          {/* Crossover zone label */}
          <div className="absolute flex items-center gap-2" style={{ top: 250 }}>
            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <span className="text-[8px] font-mono tracking-[0.2em] text-white/25 whitespace-nowrap">CROSS</span>
          </div>

          {/* Thunder zone label */}
          <div className="absolute flex items-center gap-2" style={{ top: 400 }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#ccff00', boxShadow: '0 0 6px rgba(204,255,0,0.4)' }} />
            <span className="text-[8px] font-mono tracking-[0.2em] whitespace-nowrap" style={{ color: 'rgba(204,255,0,0.4)' }}>THUNDER</span>
          </div>

          {/* Axis title */}
          <div className="absolute -left-1 top-[200px]">
            <span className="text-[7px] font-mono tracking-[0.4em] text-white/10 -rotate-90 block whitespace-nowrap origin-top-left">FREQUENCY</span>
          </div>
        </div>

        {/* Horizontal Track (moved by ScrollTrigger) */}
        <div
          ref={trackRef}
          className="flex items-start h-full px-[10vw] relative z-10 will-change-transform"
        >
          {albums.map((album) => {
            const yOffset = getVerticalOffset(album);
            return (
              <div
                key={album.id}
                className="flex-shrink-0 w-72 md:w-96 mx-8"
                style={{ transform: `translateY(${yOffset}px)` }}
              >
                <AlbumCard
                  album={album}
                  onPlay={onPlay}
                  onStop={onStop}
                  activeId={activeId}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-32 left-10 md:left-20 z-40 text-xs font-mono text-gray-500 pointer-events-none">
         <p>SCROLL <span className="text-acid-yellow">↓</span></p>
         <p>HOVER <span className="text-neon-pink">●</span></p>
      </div>

      {/* BOTTOM VISUAL TIMELINE */}
      <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black from-60% via-black/70 to-transparent z-40 flex items-end px-10 pb-4 select-none pointer-events-none">
          <div className="relative w-full h-24">

              {/* Timeline Line */}
              <div className="absolute bottom-6 left-0 w-full h-px bg-gray-600" />

              {/* Year Ticks */}
              {yearTickPositions.map(({ year, percent }) => (
                  <div
                    key={`tick-${year}`}
                    className="absolute bottom-0 flex flex-col items-center -translate-x-1/2"
                    style={{ left: `${percent}%` }}
                  >
                      <span className="text-[10px] font-mono text-gray-500">{year}</span>
                  </div>
              ))}

              {/* Album Dots */}
              {albums.map((album, index) => {
                  const percent = albumPercent(index);
                  const isActive = activeId === album.id;
                  const zone = classifyGenreZone(album);
                  const zoneColor = ZONE_COLORS[zone];
                  const accentColor = isActive && activeColors ? activeColors.primary : undefined;
                  const connectorHeight = zone === 'cloud' ? 40 : zone === 'crossover' ? 28 : 16;

                  return (
                      <div
                        key={`marker-${album.id}`}
                        className="absolute -translate-x-1/2"
                        style={{ left: `${percent}%`, bottom: 24 }}
                      >
                          {/* Dot */}
                          <div
                            className={`rounded-full transition-all duration-300 mx-auto ${isActive ? 'w-2.5 h-2.5' : 'w-1.5 h-1.5'}`}
                            style={{
                              backgroundColor: isActive ? (accentColor || '#fff') : zoneColor.primary,
                              opacity: isActive ? 1 : 0.5,
                              ...(isActive ? { boxShadow: `0 0 12px ${accentColor || zoneColor.glow}` } : {}),
                            }}
                          />

                          {/* Connector + Label — active only */}
                          {isActive && (
                            <>
                              <div
                                className="w-px mx-auto"
                                style={{
                                  height: connectorHeight,
                                  marginTop: -2 - connectorHeight - 8,
                                  backgroundColor: accentColor || zoneColor.primary,
                                  opacity: 0.6,
                                }}
                              />
                              <div
                                className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap"
                                style={{
                                  bottom: 10 + connectorHeight,
                                  color: accentColor || '#facc15',
                                }}
                              >
                                  <p className="text-[9px] font-mono leading-tight text-center">{album.artist}</p>
                                  <p className="text-[8px] font-mono leading-tight text-center text-white">{album.title}</p>
                              </div>
                            </>
                          )}
                      </div>
                  );
              })}
          </div>
      </div>

    </section>
  );
};

export default Timeline;
