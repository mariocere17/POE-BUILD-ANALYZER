// src/components/BuildAnalyzer/BuildForm.jsx
import React, { useState, useEffect } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { fetchActiveLeagues, DEFAULT_LEAGUES } from '../../utils/constants';

const BuildForm = ({
  pobCode,
  setPobCode,
  game,
  setGame,
  league,
  setLeague,
  loading,
  error,
  onAnalyze
}) => {
  const [leagues, setLeagues] = useState(DEFAULT_LEAGUES);
  const [loadingLeagues, setLoadingLeagues] = useState(false);

  // Obtener ligas al montar el componente y al cambiar el juego
  useEffect(() => {
    const loadLeagues = async () => {
      setLoadingLeagues(true);
      const fetchedLeagues = await fetchActiveLeagues(game);
      setLeagues(prev => ({
        ...prev,
        [game]: fetchedLeagues
      }));

      // Si la liga actual no está en las nuevas ligas, seleccionar la primera
      const leagueValues = fetchedLeagues.map(l => l.value);
      if (!leagueValues.includes(league)) {
        setLeague(fetchedLeagues[0]?.value || league);
      }
      setLoadingLeagues(false);
    };

    loadLeagues();
  }, [game]); // Solo cuando cambia el juego

  const handleGameChange = (newGame) => {
    setGame(newGame);
    // La liga se actualizará automáticamente en el useEffect
  };

  return (
    <div className="bg-slate-900/50 border-2 border-slate-700 rounded-xl p-8 mb-8 shadow-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm text-cyan-400 font-bold mb-3 uppercase tracking-wide">Game</label>
          <select
            value={game}
            onChange={(e) => handleGameChange(e.target.value)}
            className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all"
          >
            <option value="poe2">Path of Exile 2</option>
            <option value="poe1">Path of Exile 1</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-cyan-400 font-bold mb-3 uppercase tracking-wide">
            League {loadingLeagues && <span className="text-xs text-slate-500">(loading...)</span>}
          </label>
          <select
            value={league}
            onChange={(e) => setLeague(e.target.value)}
            disabled={loadingLeagues}
            className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all disabled:opacity-50"
          >
            {leagues[game]?.map(lg => (
              <option key={lg.value} value={lg.value}>{lg.display}</option>
            ))}
          </select>
        </div>
      </div>

      <label className="block text-sm text-cyan-400 font-bold mb-3 uppercase tracking-wide">
        PoB Code or URL
      </label>
      <textarea
        value={pobCode}
        onChange={(e) => setPobCode(e.target.value)}
        placeholder="Paste your PoB code (base64) or a pobb.in URL here&#10;&#10;Examples:&#10;• Raw PoB code: eNrtXW1z27gR_u7...&#10;• pobb.in URL: https://pobb.in/VVZy6u-NrRUi"
        className="w-full h-40 bg-slate-800 border-2 border-slate-700 rounded-lg px-5 py-4 text-white placeholder-slate-500 font-mono text-sm resize-none focus:outline-none focus:border-cyan-500 transition-all"
      />

      {error && (
        <div className="mt-4 p-4 bg-red-900/30 border-2 border-red-500 rounded-lg flex items-start gap-3">
          <AlertCircle size={22} className="text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-red-200 text-sm leading-relaxed">{error}</span>
        </div>
      )}

      <button
        onClick={onAnalyze}
        disabled={loading || !pobCode.trim()}
        className="mt-6 w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-bold text-lg uppercase tracking-wide flex items-center justify-center gap-3 transition-all duration-200 shadow-lg shadow-cyan-500/20"
      >
        <Search size={24} />
        {loading ? 'Analyzing...' : 'Analyze Build'}
      </button>
    </div>
  );
};

export default BuildForm;
