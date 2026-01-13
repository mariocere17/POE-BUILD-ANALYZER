// src/components/BuildAnalyzer/ItemList.jsx
import React from 'react';
import ItemCard from './ItemCard';
import { SELLER_STATUS_OPTIONS, LEAGUES } from '../../utils/constants';
import { useLanguage } from '../../i18n/LanguageContext';

const ItemList = ({
  items,
  league,
  sellerStatus,
  setSellerStatus,
  copiedIndex,
  onEditItem,
  onCopyUrl,
  onOpenTrade,
  game
}) => {
  const { t } = useLanguage();
  // Encontrar el display name de la liga
  const leagueDisplay = LEAGUES[game]?.find(lg => lg.value === league)?.display || league;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-cyan-400">
          {t('itemList.itemsFound')} ({items.length})
        </h2>
        <div className="flex gap-3 items-center flex-wrap">
          <div className="text-sm text-slate-300 bg-slate-800/70 px-5 py-2.5 rounded-lg border-2 border-slate-700">
            {t('itemList.league')}: <span className="text-cyan-400 font-bold">{leagueDisplay}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400 font-semibold">{t('itemList.status')}:</label>
            <select
              value={sellerStatus}
              onChange={(e) => setSellerStatus(e.target.value)}
              className="bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 transition-all"
            >
              {SELLER_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {items.map((item, index) => (
        <ItemCard
          key={item.id}
          item={item}
          index={index}
          copiedIndex={copiedIndex}
          onEdit={onEditItem}
          onCopy={onCopyUrl}
          onOpenTrade={onOpenTrade}
        />
      ))}
    </div>
  );
};

export default ItemList;
