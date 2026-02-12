import React from 'react';
import { GenreConfig } from '../genre-config';

interface FilterBarProps {
  artists: string[];
  selectedArtist: string | null;
  onSelectArtist: (artist: string | null) => void;
  viewMode: 'timeline' | 'grid';
  onChangeView: (mode: 'timeline' | 'grid') => void;
  genreConfig?: GenreConfig;
}

const FilterBar: React.FC<FilterBarProps> = ({ artists, selectedArtist, onSelectArtist, viewMode, onChangeView, genreConfig }) => {
  const accentColor = genreConfig?.colors.primary || '#ffffff';

  return (
    <div className="fixed top-0 left-0 w-full z-40 bg-black/80 backdrop-blur-sm border-b border-white/5 px-6 md:px-10 py-3">
      <div className="flex items-center gap-3">

        {/* Artist Chips */}
        <div className="flex-1 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onSelectArtist(null)}
              className="px-3 py-1 border text-[10px] font-mono uppercase tracking-wider whitespace-nowrap transition-all duration-200"
              style={!selectedArtist ? {
                borderColor: accentColor,
                color: accentColor,
                backgroundColor: `${accentColor}15`,
              } : {
                borderColor: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.35)',
              }}
            >
              ALL
            </button>
            {artists.map(artist => (
              <button
                key={artist}
                onClick={() => onSelectArtist(artist)}
                className="px-3 py-1 border text-[10px] font-mono uppercase tracking-wider whitespace-nowrap transition-all duration-200"
                style={selectedArtist === artist ? {
                  borderColor: accentColor,
                  color: accentColor,
                  backgroundColor: `${accentColor}15`,
                } : {
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.35)',
                }}
              >
                {artist}
              </button>
            ))}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center flex-shrink-0 border border-white/10">
          <button
            onClick={() => onChangeView('timeline')}
            className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider transition-all duration-200"
            style={viewMode === 'timeline' ? {
              backgroundColor: accentColor,
              color: '#000',
            } : {
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            TIMELINE
          </button>
          <button
            onClick={() => onChangeView('grid')}
            className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider transition-all duration-200"
            style={viewMode === 'grid' ? {
              backgroundColor: accentColor,
              color: '#000',
            } : {
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            GRID
          </button>
        </div>

      </div>
    </div>
  );
};

export default FilterBar;
