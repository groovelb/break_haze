import React, { useState } from 'react';
import { GenreConfig } from '../genre-config';

interface GenreCardProps {
  config: GenreConfig;
  hasData: boolean;
  onClick: () => void;
}

const GenreCard: React.FC<GenreCardProps> = ({ config, hasData, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative aspect-[3/4] w-full border overflow-hidden transition-all duration-500 group text-left ${
        hasData
          ? 'cursor-pointer'
          : 'cursor-not-allowed opacity-40'
      }`}
      style={{
        borderColor: isHovered && hasData ? config.colors.primary : 'rgba(255,255,255,0.08)',
        boxShadow: isHovered && hasData
          ? `0 0 30px ${config.colors.glow}, inset 0 0 40px ${config.colors.faded}`
          : 'none',
      }}
      disabled={!hasData}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: config.colors.gradient,
          opacity: isHovered ? 1 : 0.6,
        }}
      />

      {/* Hover glitch line */}
      {isHovered && hasData && (
        <div
          className="absolute top-0 left-0 w-full h-1 animate-glitch-skew pointer-events-none"
          style={{ backgroundColor: `${config.colors.primary}80` }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-5 md:p-6">
        {/* Era */}
        <span
          className="text-[9px] font-mono tracking-[0.3em] mb-3 block transition-colors duration-300"
          style={{ color: isHovered ? config.colors.primary : 'rgba(255,255,255,0.25)' }}
        >
          {config.era}
        </span>

        {/* Genre Name */}
        <h2
          className="font-display text-xl md:text-2xl leading-none tracking-tight mb-2 transition-colors duration-300"
          style={{ color: isHovered ? config.colors.primary : 'rgba(255,255,255,0.7)' }}
        >
          {config.name}
        </h2>

        {/* Tagline */}
        <p className="text-[9px] font-mono tracking-[0.15em] text-white/30 leading-relaxed">
          {config.tagline}
        </p>

        {/* Coming soon badge */}
        {!hasData && (
          <div className="mt-3 border border-white/10 px-2 py-0.5 inline-block w-fit">
            <span className="text-[8px] font-mono tracking-[0.2em] text-white/20">COMING_SOON</span>
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 h-px transition-all duration-500"
        style={{
          backgroundColor: config.colors.primary,
          width: isHovered ? '100%' : '0%',
          opacity: 0.6,
        }}
      />
    </button>
  );
};

export default GenreCard;
