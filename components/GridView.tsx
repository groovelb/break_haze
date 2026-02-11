import React from 'react';
import { EnrichedAlbum } from '../types';
import AlbumCard from './AlbumCard';

interface GridViewProps {
  albums: EnrichedAlbum[];
  onPlay: (url: string, style: 'thunder' | 'cloud') => void;
  onStop: () => void;
  activeId: string | null;
}

const GridView: React.FC<GridViewProps> = ({ albums, onPlay, onStop, activeId }) => {
  if (albums.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center font-mono text-xs text-gray-600 uppercase">
        NO_RECORDS_FOUND
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pt-40 pb-20 px-8 md:px-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {albums.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            onPlay={onPlay}
            onStop={onStop}
            activeId={activeId}
            variant="grid"
          />
        ))}
      </div>
    </div>
  );
};

export default GridView;
