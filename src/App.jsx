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
import { Bug, X, AlertTriangle } from 'lucide-react';
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
    gameSwitch,
    setPobCode,
    setEditingItem,
    setLeague,
    setSellerStatus,
    handleParsePoB,
    handleCopyToClipboard,
    handleOpenTradeURL,
    handleSaveItem,
    handleGameChange,
    dismissGameSwitch
  } = useBuildAnalyzer();

  return (
    <div className="min-h-screen bg-textured text-white p-6 flex flex-col">
      <div className="max-w-7xl mx-auto flex-1 w-full">
        <Header />

        {/* Game Switch Notification */}
        {gameSwitch && (
          <div className="mb-4 bg-amber-500/20 border border-amber-500/50 rounded-lg p-4 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-amber-400 flex-shrink-0" size={24} />
              <p className="text-amber-200">
                {t('notifications.gameSwitched', {
                  from: gameSwitch.from === 'poe1' ? 'Path of Exile 1' : 'Path of Exile 2',
                  to: gameSwitch.to === 'poe1' ? 'Path of Exile 1' : 'Path of Exile 2'
                })}
              </p>
            </div>
            <button
              onClick={dismissGameSwitch}
              className="text-amber-400 hover:text-amber-300 transition-colors p-1"
              aria-label="Dismiss"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <BuildForm
          pobCode={pobCode}
          setPobCode={setPobCode}
          game={game}
          onGameChange={handleGameChange}
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
            game={game}
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
