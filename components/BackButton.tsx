import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/')}
      className="fixed top-4 right-6 md:right-10 z-40 px-3 py-1.5 border border-white/15 text-[10px] font-mono tracking-[0.2em] text-white/40 hover:text-white hover:border-white/40 transition-all duration-300 uppercase bg-black/30 backdrop-blur-sm"
    >
      &larr; ALL GENRES
    </button>
  );
};

export default BackButton;
