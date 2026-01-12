// src/hooks/useBuildAnalyzer.js
import { useState } from 'react';
import { parsePoB } from '../services/pobParser';
import { generateTradeURL } from '../services/tradeAPI';
import { fetchStatIds } from '../services/statsAPI';
import { sanitizeTradeURL } from '../config/apiConfig';
import { LEAGUES } from '../utils/constants';

export const useBuildAnalyzer = () => {
  const [pobCode, setPobCode] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [game, setGame] = useState('poe2');
  const [league, setLeague] = useState(LEAGUES.poe2[0].value);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [statCache, setStatCache] = useState(null);
  const [sellerStatus, setSellerStatus] = useState('any');

  const handleParsePoB = async () => {
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
  };

  const handleFetchStats = async () => {
    const stats = await fetchStatIds(game, statCache);
    if (stats && !statCache) {
      setStatCache(stats);
    }
    return stats;
  };

  const handleCopyToClipboard = async (item, index) => {
    const stats = await handleFetchStats();
    const url = await generateTradeURL(item, game, league, sellerStatus, stats);
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleOpenTradeURL = async (item) => {
    try {
      const stats = await handleFetchStats();
      const url = await generateTradeURL(item, game, league, sellerStatus, stats);
      // Sanitizar URL antes de abrir en nueva ventana
      const safeUrl = sanitizeTradeURL(url);
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening trade URL:', error);
      setError('Failed to open trade URL. Please try again.');
    }
  };

  const handleSaveItem = (editedItem) => {
    setItems(items.map(i => i.id === editedItem.id ? editedItem : i));
  };

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
