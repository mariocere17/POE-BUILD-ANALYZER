// src/hooks/useBuildAnalyzer.js
import { useState, useCallback, useRef } from 'react';
import { parsePoB } from '../services/pobParser';
import { generateTradeURL } from '../services/tradeAPI';
import { fetchStatIds } from '../services/statsAPI';
import { sanitizeTradeURL } from '../config/apiConfig';
import { LEAGUES, DEFAULT_TRADE_MODE } from '../utils/constants';

// Default pobb.in URL for development convenience
const DEV_DEFAULT_POB = process.env.NODE_ENV === 'development'
  ? 'https://pobb.in/YnSljOLHhnjt'
  : '';

// Default game for development
const DEV_DEFAULT_GAME = process.env.NODE_ENV === 'development' ? 'poe1' : 'poe2';

export const useBuildAnalyzer = () => {
  const [pobCode, setPobCode] = useState(DEV_DEFAULT_POB);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [game, setGame] = useState(DEV_DEFAULT_GAME);
  const [league, setLeague] = useState(LEAGUES[DEV_DEFAULT_GAME][0].value);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [sellerStatus, setSellerStatus] = useState(DEFAULT_TRADE_MODE);
  const [gameSwitch, setGameSwitch] = useState(null); // { from: 'poe1', to: 'poe2' } when auto-switched

  // Use ref for stat cache to avoid re-creating callbacks when cache updates
  const statCacheRef = useRef(null);

  // Use ref for sellerStatus to always get current value in callbacks
  const sellerStatusRef = useRef(sellerStatus);
  sellerStatusRef.current = sellerStatus;

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
    setGameSwitch(null); // Clear previous notification

    try {
      const { items: parsedItems, detectedGame } = await parsePoB(pobCode);

      // If game detected and different from selected, auto-switch and notify
      if (detectedGame && detectedGame !== game) {
        console.log(`[POB] Detected game: ${detectedGame}, switching from ${game}`);
        setGameSwitch({ from: game, to: detectedGame });
        setGame(detectedGame);
        setLeague(LEAGUES[detectedGame][0].value);
        // Clear stat cache when switching games
        statCacheRef.current = null;
      }

      setItems(parsedItems);
      setError('');
    } catch (err) {
      setError(err.message || 'Error al parsear el código PoB');
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [pobCode, game]);

  const handleCopyToClipboard = useCallback(async (item, index) => {
    try {
      const stats = await handleFetchStats(game);
      const url = await generateTradeURL(item, game, league, sellerStatusRef.current, stats);
      await navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Error copying trade URL:', err);
      setError('Failed to copy trade URL. Please try again.');
    }
  }, [game, league, handleFetchStats]);

  const handleOpenTradeURL = useCallback(async (item) => {
    try {
      const stats = await handleFetchStats(game);
      // Use ref to get current sellerStatus value
      const url = await generateTradeURL(item, game, league, sellerStatusRef.current, stats);
      // Sanitizar URL antes de abrir en nueva ventana
      const safeUrl = sanitizeTradeURL(url);
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Error opening trade URL:', err);
      setError('Failed to open trade URL. Please try again.');
    }
  }, [game, league, handleFetchStats]);

  const handleSaveItem = useCallback((editedItem) => {
    setItems(prevItems => prevItems.map(i => i.id === editedItem.id ? editedItem : i));
  }, []);

  // Handle game change
  const handleGameChange = useCallback((newGame) => {
    setGame(newGame);
    // Clear stat cache to avoid using wrong game's stats
    statCacheRef.current = null;
  }, []);

  // Dismiss game switch notification
  const dismissGameSwitch = useCallback(() => {
    setGameSwitch(null);
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
    gameSwitch,

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
    handleSaveItem,
    handleGameChange,
    dismissGameSwitch
  };
};
