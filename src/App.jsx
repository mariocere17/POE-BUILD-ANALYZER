// src/App.jsx
import React, { useState } from 'react';
import { useBuildAnalyzer } from './hooks/useBuildAnalyzer';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import BuildForm from './components/BuildAnalyzer/BuildForm';
import ItemList from './components/BuildAnalyzer/ItemList';
import EditItemModal from './components/BuildAnalyzer/EditItemModal';
import ReportModal from './components/ReportModal';
import CurrencyConverter from './components/PoeNinja/CurrencyConverter';
import { poe2CurrencyPairs, poe1CurrencyPairs } from './config/currencyPairs';
import { Bug } from 'lucide-react';
import LanguageSelector from './components/Layout/LanguageSelector';
import { useLanguage } from './i18n/LanguageContext';

const PoEBuildAnalyzer = () => {
  const { t } = useLanguage();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
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

        {/* Report Modal */}
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          gameConfig={{ selectedGame: game, selectedLeague: league }}
        />

        {/* Floating Report Button */}
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="fixed bottom-6 right-6 bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 z-40 group"
          aria-label="Report an issue"
          title="Report Bug or Request Feature"
        >
          <Bug size={24} />
          <span className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {t('reportModal.reportIssue')}
          </span>
        </button>

        {/* Language Selector Button */}
        <LanguageSelector />
      </div>

      <Footer />
    </div>
  );
};

export default PoEBuildAnalyzer;
