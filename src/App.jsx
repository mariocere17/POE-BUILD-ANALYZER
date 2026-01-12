// src/App.jsx
import React from 'react';
import { useBuildAnalyzer } from './hooks/useBuildAnalyzer';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import BuildForm from './components/BuildAnalyzer/BuildForm';
import ItemList from './components/BuildAnalyzer/ItemList';
import EditItemModal from './components/BuildAnalyzer/EditItemModal';
import CurrencyConverter from './components/PoeNinja/CurrencyConverter';
import { poe2CurrencyPairs, poe1CurrencyPairs } from './config/currencyPairs';

const PoEBuildAnalyzer = () => {
  const {
    pobCode,
    items,
    loading,
    error,
    editingItem,
    game,
    league,
    copiedIndex,
    sellerStatus,
    setPobCode,
    setEditingItem,
    setGame,
    setLeague,
    setSellerStatus,
    handleParsePoB,
    handleCopyToClipboard,
    handleOpenTradeURL,
    handleSaveItem
  } = useBuildAnalyzer();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6 flex flex-col">
      <div className="max-w-7xl mx-auto flex-1 w-full">
        <Header />

        <BuildForm
          pobCode={pobCode}
          setPobCode={setPobCode}
          game={game}
          setGame={setGame}
          league={league}
          setLeague={setLeague}
          loading={loading}
          error={error}
          onAnalyze={handleParsePoB}
        />

        {items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Panel lateral de currency */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <CurrencyConverter
                league={league}
                game={game}
                currencyPairs={game === 'poe2' ? poe2CurrencyPairs : poe1CurrencyPairs}
              />
            </div>

            {/* Lista de items */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <ItemList
                items={items}
                league={league}
                game={game}
                sellerStatus={sellerStatus}
                setSellerStatus={setSellerStatus}
                copiedIndex={copiedIndex}
                onEditItem={setEditingItem}
                onCopyUrl={handleCopyToClipboard}
                onOpenTrade={handleOpenTradeURL}
              />
            </div>
          </div>
        )}

        {editingItem && (
          <EditItemModal
            item={editingItem}
            onClose={() => setEditingItem(null)}
            onSave={handleSaveItem}
          />
        )}
      </div>

      <Footer />
    </div>
  );
};

export default PoEBuildAnalyzer;
