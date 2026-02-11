import React from 'react';

interface FilterBarProps {
  artists: string[];
  selectedArtist: string | null;
  onSelectArtist: (artist: string | null) => void;
  viewMode: 'timeline' | 'grid';
  onChangeView: (mode: 'timeline' | 'grid') => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ artists, selectedArtist, onSelectArtist, viewMode, onChangeView }) => {
  return (
    <div className="fixed top-0 left-0 w-full z-40 bg-white px-6 md:px-10 py-3">
      <div className="flex items-center gap-3">

        {/* Artist Chips */}
        <div className="flex-1 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onSelectArtist(null)}
              className={`px-3 py-1 border text-[10px] font-mono uppercase tracking-wider whitespace-nowrap transition-all duration-200
                ${!selectedArtist
                  ? 'border-black text-black bg-black/10'
                  : 'border-gray-300 text-gray-400 hover:border-gray-500 hover:text-gray-600'
                }`}
            >
              ALL
            </button>
            {artists.map(artist => (
              <button
                key={artist}
                onClick={() => onSelectArtist(artist)}
                className={`px-3 py-1 border text-[10px] font-mono uppercase tracking-wider whitespace-nowrap transition-all duration-200
                  ${selectedArtist === artist
                    ? 'border-black text-black bg-black/10'
                    : 'border-gray-300 text-gray-400 hover:border-gray-500 hover:text-gray-600'
                  }`}
              >
                {artist}
              </button>
            ))}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center flex-shrink-0 border border-gray-300">
          <button
            onClick={() => onChangeView('timeline')}
            className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider transition-all duration-200
              ${viewMode === 'timeline' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600'}`}
          >
            TIMELINE
          </button>
          <button
            onClick={() => onChangeView('grid')}
            className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider transition-all duration-200
              ${viewMode === 'grid' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600'}`}
          >
            GRID
          </button>
        </div>

      </div>
    </div>
  );
};

export default FilterBar;
