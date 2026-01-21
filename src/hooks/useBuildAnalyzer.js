// src/hooks/useBuildAnalyzer.js
import { useState, useCallback, useRef } from 'react';
import { parsePoB } from '../services/pobParser';
import { generateTradeURL } from '../services/tradeAPI';
import { fetchStatIds } from '../services/statsAPI';
import { sanitizeTradeURL } from '../config/apiConfig';
import { LEAGUES } from '../utils/constants';

// Default pobb.in URL for development convenience
const DEV_DEFAULT_POB = process.env.NODE_ENV === 'development'
  ? 'https://pobb.in/b9xtMTSdeHFw'
  : '';

export const useBuildAnalyzer = () => {
  const [pobCode, setPobCode] = useState(DEV_DEFAULT_POB);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [game, setGame] = useState('poe1');
  const [league, setLeague] = useState(LEAGUES.poe1[0].value);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [sellerStatus, setSellerStatus] = useState('any');

  // Use ref for stat cache to avoid re-creating callbacks when cache updates
  const statCacheRef = useRef(null);

  const handleFetchStats = useCallback(async (currentGame) => {
    const stats = await fetchStatIds(currentGame, statCacheRef.current);
    if (stats && !statCacheRef.current) {
      statCacheRef.current = stats;
    }
    return stats;
  }, []);

  const handleParsePoB = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const parsedItems = await parsePoB(pobCode);
      setItems(parsedItems);
      setError('');
    } catch (err) {
      setError(err.message || 'Error al parsear el código PoB');
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [pobCode]);

  const handleCopyToClipboard = useCallback(async (item, index) => {
    const stats = await handleFetchStats(game);
    const url = await generateTradeURL(item, game, league, sellerStatus, stats);
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, [game, league, sellerStatus, handleFetchStats]);

  const handleOpenTradeURL = useCallback(async (item) => {
    try {
      const stats = await handleFetchStats(game);
      const url = await generateTradeURL(item, game, league, sellerStatus, stats);
      // Sanitizar URL antes de abrir en nueva ventana
      const safeUrl = sanitizeTradeURL(url);
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Error opening trade URL:', err);
      setError('Failed to open trade URL. Please try again.');
    }
  }, [game, league, sellerStatus, handleFetchStats]);

  const handleSaveItem = useCallback((editedItem) => {
    setItems(prevItems => prevItems.map(i => i.id === editedItem.id ? editedItem : i));
  }, []);

  return {
    // State
    pobCode,
    items,
    loading,
    error,
    editingItem,
    game,
    league,
    copiedIndex,
    sellerStatus,

    // Setters
    setPobCode,
    setEditingItem,
    setGame,
    setLeague,
    setSellerStatus,

    // Actions
    handleParsePoB,
    handleCopyToClipboard,
    handleOpenTradeURL,
    handleSaveItem
  };
};
