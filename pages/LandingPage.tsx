import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GENRE_ORDER, getGenreConfig, GenreId } from '../genre-config';
import GenreCard from '../components/GenreCard';

const GENRES_WITH_DATA: Set<GenreId> = new Set(['big-beat', 'trip-hop', 'boombap']);

interface LandingPageProps {
  onInitAudio: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onInitAudio }) => {
  const navigate = useNavigate();

  const handleSelect = (genreId: GenreId) => {
    onInitAudio();
    navigate(`/genre/${genreId}`);
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-6 py-20 md:py-28">
      {/* Title */}
      <div className="text-center mb-12 md:mb-16 pointer-events-none select-none">
        <h1 className="font-display text-5xl md:text-7xl leading-none tracking-tighter">
          THE BREAK <br /> & THE HAZE
        </h1>
        <p className="font-mono text-[10px] md:text-xs mt-4 text-white/30 tracking-[0.4em] uppercase">
          SELECT_FREQUENCY
        </p>
      </div>

      {/* Genre Grid */}
      <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {GENRE_ORDER.map((genreId) => {
          const config = getGenreConfig(genreId);
          return (
            <GenreCard
              key={genreId}
              config={config}
              hasData={GENRES_WITH_DATA.has(genreId)}
              onClick={() => handleSelect(genreId)}
            />
          );
        })}
      </div>

      {/* Footer hint */}
      <p className="font-mono text-[8px] text-white/15 tracking-[0.3em] mt-12 uppercase">
        90s SONIC ARCHIVES [Beta_v2.0]
      </p>
    </div>
  );
};

export default LandingPage;
