import React from 'react';
import { GenreConfig } from '../genre-config';

interface GenreHeaderProps {
  config: GenreConfig;
}

const GenreHeader: React.FC<GenreHeaderProps> = ({ config }) => {
  return (
    <header className="fixed top-14 left-6 md:left-10 z-30 mix-blend-difference pointer-events-none">
      <h1 className="font-display text-4xl md:text-6xl leading-none tracking-tighter">
        {config.name.toUpperCase()}
      </h1>
      <p className="font-mono text-xs md:text-sm mt-2 tracking-widest uppercase" style={{ color: `${config.colors.primary}99` }}>
        {config.tagline} [{config.era}]
      </p>
    </header>
  );
};

export default GenreHeader;
