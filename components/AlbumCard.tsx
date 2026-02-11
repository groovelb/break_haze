import React, { useRef, useState } from 'react';
import { EnrichedAlbum } from '../types';

interface AlbumCardProps {
  album: EnrichedAlbum;
  onPlay: (url: string, style: 'thunder' | 'cloud') => void;
  onStop: () => void;
  activeId: string | null;
  variant?: 'timeline' | 'grid';
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album, onPlay, onStop, activeId, variant = 'timeline' }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isActive = activeId === album.id;

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (album.previewUrl) {
      onPlay(album.previewUrl, album.genre_style);
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
          : 'flex-shrink-0 w-72 md:w-96 mx-8 z-10'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Vinyl/Case Wrapper */}
      <div className={`relative aspect-square border-2 overflow-hidden transition-colors duration-300 ${isHovered || isActive ? 'border-white' : 'border-neutral-800'}`}>
        
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
             <div className="absolute inset-0 bg-white opacity-10 mix-blend-color-dodge animate-pulse pointer-events-none" />
             <div className="absolute top-0 left-0 w-full h-2 bg-white/50 animate-glitch-skew pointer-events-none" />
          </>
        )}

        {/* Play Indicator (Now simpler as it's hover) */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
             <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center animate-spin-slow">
                <div className="w-4 h-4 bg-white rounded-full animate-ping" />
             </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 font-mono text-xs uppercase tracking-widest relative">
        <div className={`absolute -left-2 top-0 h-full w-1 transition-all duration-300 ${isHovered ? 'bg-white' : 'bg-transparent'}`} />
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
