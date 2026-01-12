// src/components/Layout/Header.jsx
import React from 'react';

const Header = () => {
  return (
    <div className="text-center mb-10">
      <h1 className="text-5xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-400 tracking-tight">
        PoE Build Analyzer
      </h1>
      <p className="text-slate-400 text-lg">Choose your favourite streamer build and generate trade links instantly</p>
    </div>
  );
};

export default Header;
