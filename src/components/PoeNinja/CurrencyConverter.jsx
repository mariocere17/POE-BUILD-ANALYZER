// src/components/PoeNinja/CurrencyConverter.jsx
import React, { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../../config/apiConfig';
import poe1Logo from '../../assets/other-icons/poe1-logo.png';
import poe2Logo from '../../assets/other-icons/poe2-logo.png';

/**
 * CurrencyConverter Component
 *
 * Muestra pares de conversión de monedas personalizados con rotación automática
 *
 * @param {Object} props
 * @param {string} props.league - Liga actual
 * @param {string} props.game - Juego (poe1/poe2)
 * @param {Array} props.currencyPairs - Array de pares de conversión
 * @param {number} props.maxVisible - Máximo de items visibles (default: 5)
 * @param {number} props.rotationInterval - Intervalo de rotación en ms (default: 5000)
 *
 * Formato de currencyPairs:
 * [
 *   { from: "Mirror of Kalandra", to: "Divine Orb", iconUrl: null },
 *   { from: "Divine Orb", to: "Chaos Orb", iconUrl: null },
 *   { from: "Divine Orb", to: "Exalted Orb", iconUrl: null }
 * ]
 */
const CurrencyConverter = ({
  league,
  game,
  currencyPairs = [],
  maxVisible = 5,
  rotationInterval = 5000
}) => {
  const [currencyData, setCurrencyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  // Fetch currency data
  useEffect(() => {
    const fetchCurrencyData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Para PoE2: usar endpoint multi-categoría que incluye currency, abyss, ritual, lineagesupportgems
        // Para PoE1: usar endpoint original (solo currency)
        const url = game === 'poe2'
          ? `${API_ENDPOINTS.currencyMulti}?categories=currency,abyss,ritual,lineagesupportgems&league=${encodeURIComponent(league)}`
          : `${API_ENDPOINTS.currency}?league=${encodeURIComponent(league)}&game=${game}`;

        if (process.env.NODE_ENV === 'development') {
          console.log(`Fetching ${game.toUpperCase()} data:`, url);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, { signal: controller.signal });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Failed to fetch currency data');
        }

        const data = await response.json();

        if (process.env.NODE_ENV === 'development') {
          console.log('Currency data received:', data);
        }

        setCurrencyData(data);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching currency data:', err);
        }
        setError(err.name === 'AbortError' ? 'Request timeout' : err.message);
      } finally {
        setLoading(false);
      }
    };

    if (league && game) {
      fetchCurrencyData();
    }
  }, [league, game]);

  // Auto-rotation effect
  useEffect(() => {
    // Solo rotar si hay más items que el máximo visible
    if (currencyPairs.length <= maxVisible) {
      return;
    }

    // Limpiar intervalo previo
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // No iniciar intervalo si está pausado
    if (isPaused) {
      return;
    }

    // Configurar nuevo intervalo
    intervalRef.current = setInterval(() => {
      setIsAnimating(true);

      setTimeout(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          // Si llegamos al final, volver al inicio
          return nextIndex >= currencyPairs.length ? 0 : nextIndex;
        });
        setIsAnimating(false);
      }, 300); // Duración de la animación de salida
    }, rotationInterval);

    // Cleanup al desmontar o cambiar dependencias
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currencyPairs.length, maxVisible, rotationInterval, isPaused]);

  /**
   * Obtiene el precio de una moneda en Chaos Orbs
   */
  const getCurrencyPrice = (currencyName) => {
    if (!currencyData || !currencyData.items) return null;

    const currency = currencyData.items.find(
      item => item.text.toLowerCase() === currencyName.toLowerCase()
    );

    return currency ? Math.round(currency.currentPrice) : null;
  };

  /**
   * Calcula el ratio entre dos monedas
   */
  const getConversionRate = (fromCurrency, toCurrency) => {
    const fromPrice = getCurrencyPrice(fromCurrency);
    const toPrice = getCurrencyPrice(toCurrency);

    if (!fromPrice || !toPrice || toPrice === 0) return null;

    // Si "from" es más caro que "to", retornamos cuántas "to" obtienes por una "from"
    // Ejemplo: Mirror (1,000,000 chaos) / Divine (57 chaos) = 17,544 divines por mirror
    return Math.round(fromPrice / toPrice);
  };

  /**
   * Formatea el número con separadores de miles
   */
  const formatNumber = (num) => {
    if (!num) return '---';
    return num.toLocaleString('en-US');
  };

  /**
   * Obtiene los items visibles según el índice actual
   */
  const getVisiblePairs = () => {
    if (currencyPairs.length <= maxVisible) {
      return currencyPairs;
    }

    const visible = [];
    for (let i = 0; i < maxVisible; i++) {
      const index = (currentIndex + i) % currencyPairs.length;
      visible.push({ ...currencyPairs[index], originalIndex: index });
    }
    return visible;
  };

  /**
   * Handlers para pausar/reanudar rotación al hacer hover
   */
  const handleMouseEnter = () => {
    if (currencyPairs.length > maxVisible) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (currencyPairs.length > maxVisible) {
      setIsPaused(false);
    }
  };

  // Logo según el juego
  const gameLogo = game === 'poe2' ? poe2Logo : poe1Logo;

  return (
    <div
      className="bg-slate-900/50 border-2 border-slate-700 rounded-xl p-6 sticky top-6"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-3 mb-6">
        <img
          src={gameLogo}
          alt={game === 'poe2' ? 'Path of Exile 2' : 'Path of Exile'}
          className="w-10 h-10 object-contain"
        />
        <div>
          <h3 className="text-lg font-bold text-cyan-400 uppercase tracking-wide">
            Economy Status
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {game === 'poe2' ? 'Path of Exile 2' : 'Path of Exile'} • {league}
          </p>
        </div>
      </div>

      {loading && (
        <div className="text-slate-400 text-sm animate-pulse">
          Loading prices...
        </div>
      )}

      {error && (
        <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4">
          <p className="text-yellow-300 text-sm font-semibold mb-1">⚠️ API unavailable</p>
          <p className="text-yellow-200/80 text-xs">
            Could not connect to poe2scout. Check your internet connection.
          </p>
        </div>
      )}

      {!loading && !error && currencyData && currencyPairs.length > 0 && (
        <div className="relative">
          {/* Indicador de rotación si hay más de maxVisible items */}
          {currencyPairs.length > maxVisible && (
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
              <span>
                Showing {maxVisible} of {currencyPairs.length}
                {isPaused && (
                  <span className="ml-2 text-cyan-400 font-semibold">
                    ⏸ Paused
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(currencyPairs.length, 10) }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        i === currentIndex % Math.min(currencyPairs.length, 10)
                          ? 'bg-cyan-400 w-3'
                          : 'bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 overflow-hidden">
            {getVisiblePairs().map((pair, index) => {
              const rate = getConversionRate(pair.from, pair.to);

              return (
                <div
                  key={`${pair.originalIndex || index}-${pair.from}-${pair.to}`}
                  className={`flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-cyan-500/30 transition-all duration-300 ${
                    isAnimating ? 'animate-slideOut' : 'animate-slideIn'
                  }`}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <div className="flex items-center gap-3">
                    {pair.iconUrl ? (
                      <img
                        src={pair.iconUrl}
                        alt={pair.from}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center text-xs text-slate-500">
                        💰
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-slate-300 font-semibold">{pair.from}</span>
                      <p className="text-xs text-slate-500">→ {pair.to}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-cyan-400 font-bold text-lg">
                      {formatNumber(rate)}
                    </div>
                    <div className="text-xs text-slate-500">{pair.to}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && !error && currencyData && currencyPairs.length === 0 && (
        <div className="text-slate-400 text-sm">
          No currency pairs configured
        </div>
      )}

      {!loading && !error && !currencyData && (
        <div className="text-slate-400 text-sm">
          No data available
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Source: poe2scout
          </span>
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;
