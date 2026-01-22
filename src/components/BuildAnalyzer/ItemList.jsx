// src/components/BuildAnalyzer/ItemList.jsx
import React, { useState, useMemo } from 'react';
import ItemCard from './ItemCard';
import { SELLER_STATUS_OPTIONS, LEAGUES, ITEM_CATEGORIES, getItemCategory } from '../../utils/constants';
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
  const [selectedCategory, setSelectedCategory] = useState(ITEM_CATEGORIES.all);

  // Encontrar el display name de la liga
  const leagueDisplay = LEAGUES[game]?.find(lg => lg.value === league)?.display || league;

  // Count items per category
  const categoryCounts = useMemo(() => {
    const counts = {
      [ITEM_CATEGORIES.all]: items.length,
      [ITEM_CATEGORIES.weapons]: 0,
      [ITEM_CATEGORIES.armour]: 0,
      [ITEM_CATEGORIES.accessories]: 0,
      [ITEM_CATEGORIES.flasks]: 0,
      [ITEM_CATEGORIES.jewels]: 0,
      [ITEM_CATEGORIES.grafts]: 0,
      [ITEM_CATEGORIES.charms]: 0,
    };

    items.forEach(item => {
      const category = getItemCategory(item);
      counts[category]++;
    });

    return counts;
  }, [items]);

  // Filter items based on selected category
  const filteredItems = useMemo(() => {
    if (selectedCategory === ITEM_CATEGORIES.all) {
      return items;
    }
    return items.filter(item => getItemCategory(item) === selectedCategory);
  }, [items, selectedCategory]);

  // Category options for the selector - grafts/charms only shown if there are items of that type
  const categoryOptions = useMemo(() => {
    const baseOptions = [
      { value: ITEM_CATEGORIES.all, labelKey: 'all' },
      { value: ITEM_CATEGORIES.weapons, labelKey: 'weapons' },
      { value: ITEM_CATEGORIES.armour, labelKey: 'armour' },
      { value: ITEM_CATEGORIES.accessories, labelKey: 'accessories' },
      { value: ITEM_CATEGORIES.flasks, labelKey: 'flasks' },
      { value: ITEM_CATEGORIES.jewels, labelKey: 'jewels' },
    ];

    // Only add grafts category if there are graft items (PoE1 Keepers league specific)
    if (categoryCounts[ITEM_CATEGORIES.grafts] > 0) {
      baseOptions.push({ value: ITEM_CATEGORIES.grafts, labelKey: 'grafts' });
    }

    // Only add charms category if there are charm items (PoE2 specific)
    if (categoryCounts[ITEM_CATEGORIES.charms] > 0) {
      baseOptions.push({ value: ITEM_CATEGORIES.charms, labelKey: 'charms' });
    }

    return baseOptions;
  }, [categoryCounts]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-3xl font-bold text-cyan-400">
            {t('itemList.itemsFound')} ({filteredItems.length})
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 transition-all"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {t(`itemList.categories.${option.labelKey}`)} ({categoryCounts[option.value]})
                </option>
              ))}
            </select>
          </div>
        </div>
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
                <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredItems.map((item, index) => (
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
