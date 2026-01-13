// src/components/BuildAnalyzer/ItemCard.jsx
import React, { useState } from 'react';
import { Edit2, Copy, Check, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { getRarityColor } from '../../utils/rarityColors';
import { useLanguage } from '../../i18n/LanguageContext';

const ItemCard = ({ item, index, copiedIndex, onEdit, onCopy, onOpenTrade }) => {
  const { t } = useLanguage();
  const [showAllEnchants, setShowAllEnchants] = useState(false);
  const [showAllImplicits, setShowAllImplicits] = useState(false);
  const [showAllExplicits, setShowAllExplicits] = useState(false);

  return (
    <div className="bg-slate-900/50 border-2 border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-200 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className={`text-2xl font-bold mb-1 ${getRarityColor(item.rarity)}`}>{item.name}</h3>
          {item.name !== item.baseType && (
            <p className="text-sm text-slate-400">{item.baseType}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-3 py-1.5 bg-slate-800 border-2 border-slate-600 rounded-md capitalize text-xs font-bold text-slate-300">
              {item.rarity}
            </span>
            {item.ilvl && (
              <span className="px-3 py-1.5 bg-slate-800 border-2 border-slate-600 rounded-md text-xs font-bold text-slate-300">
                iLvl {item.ilvl}
              </span>
            )}
            {item.levelReq > 0 && (
              <span className="px-3 py-1.5 bg-blue-900/50 border-2 border-blue-500 text-blue-300 rounded-md text-xs font-bold">
                Req Lvl {item.levelReq}
              </span>
            )}
            {item.corrupted && (
              <span className="px-3 py-1.5 bg-red-900/50 border-2 border-red-500 text-red-300 rounded-md text-xs font-bold">
                {t('itemCard.corrupted')}
              </span>
            )}
            {item.socketCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-900/50 border-2 border-purple-500 rounded-md">
                {Array.from({ length: item.socketCount }).map((_, i) => (
                  <span key={i} className="inline-block w-3 h-3 rounded-full bg-purple-400 border-2 border-purple-300"></span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 ml-6 flex-shrink-0">
          <button
            onClick={() => onEdit(item)}
            className="p-3 bg-slate-800 hover:bg-cyan-500/20 border-2 border-slate-600 hover:border-cyan-500 rounded-lg transition-all duration-200 flex-shrink-0"
            title={t('itemCard.editFilters')}
          >
            <Edit2 size={20} className="text-cyan-400" />
          </button>
          <button
            onClick={() => onCopy(item, index)}
            className="p-3 bg-slate-800 hover:bg-emerald-500/20 border-2 border-slate-600 hover:border-emerald-500 rounded-lg transition-all duration-200 flex-shrink-0"
            title={t('itemCard.copyUrl')}
          >
            {copiedIndex === index ? (
              <Check size={20} className="text-emerald-400" />
            ) : (
              <Copy size={20} className="text-emerald-400" />
            )}
          </button>
          <button
            onClick={() => onOpenTrade(item)}
            className="p-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 rounded-lg transition-all duration-200 flex-shrink-0"
            title={t('itemCard.searchInTrade')}
          >
            <ExternalLink size={20} className="text-white" />
          </button>
        </div>
      </div>

      {(item.enchantMods.length > 0 || item.implicitMods.length > 0 || item.explicitMods.length > 0) && (
        <div className="mt-5 pt-5 border-t-2 border-slate-700 space-y-4">
          {item.enchantMods.length > 0 && (
            <div>
              <p className="text-xs text-teal-400 mb-2 font-bold uppercase tracking-wide border-l-4 border-teal-400 pl-3">
                {t('itemCard.enchants')} ({item.enchantMods.length})
              </p>
              <div className="space-y-1.5 pl-5">
                {(showAllEnchants ? item.enchantMods : item.enchantMods.slice(0, 3)).map((mod, i) => (
                  <p key={i} className="text-sm text-teal-200 font-medium">
                    {mod.hasAllocates && (
                      <span className="text-xs bg-green-900/60 border border-green-400 px-2 py-0.5 rounded mr-2">[{t('itemCard.allocates')}]</span>
                    )}
                    {mod.isRuneEnchant && (
                      <span className="text-xs bg-teal-900/60 border border-teal-400 px-2 py-0.5 rounded mr-2">[{t('itemCard.rune')}]</span>
                    )}
                    {!mod.isRuneEnchant && !mod.hasAllocates && (
                      <span className="text-xs bg-teal-900/60 border border-teal-400 px-2 py-0.5 rounded mr-2">[{t('itemCard.enchant')}]</span>
                    )}
                    {mod.text}
                  </p>
                ))}
                {item.enchantMods.length > 3 && (
                  <button
                    onClick={() => setShowAllEnchants(!showAllEnchants)}
                    className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors mt-2 font-semibold"
                  >
                    {showAllEnchants ? (
                      <>
                        <ChevronUp size={14} />
                        {t('itemCard.showLess')}
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} />
                        {t('itemCard.showAll')} ({item.enchantMods.length})
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {item.implicitMods.length > 0 && (
            <div>
              <p className="text-xs text-emerald-400 mb-2 font-bold uppercase tracking-wide border-l-4 border-emerald-400 pl-3">
                {t('itemCard.implicitMods')} ({item.implicitMods.length})
              </p>
              <div className="space-y-1.5 pl-5">
                {(showAllImplicits ? item.implicitMods : item.implicitMods.slice(0, 3)).map((mod, i) => (
                  <p key={i} className={`text-sm font-medium ${mod.fractured ? 'text-yellow-300' : 'text-emerald-200'}`}>
                    {mod.fractured && (
                      <span className="text-xs bg-yellow-900/60 border border-yellow-400 px-2 py-0.5 rounded mr-2">[{t('itemCard.fractured')}]</span>
                    )}
                    {!mod.fractured && (
                      <span className="text-xs bg-emerald-900/60 border border-emerald-400 px-2 py-0.5 rounded mr-2">[{t('itemCard.implicit')}]</span>
                    )}
                    {mod.text}
                  </p>
                ))}
                {item.implicitMods.length > 3 && (
                  <button
                    onClick={() => setShowAllImplicits(!showAllImplicits)}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors mt-2 font-semibold"
                  >
                    {showAllImplicits ? (
                      <>
                        <ChevronUp size={14} />
                        {t('itemCard.showLess')}
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} />
                        {t('itemCard.showAll')} ({item.implicitMods.length})
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {item.explicitMods.length > 0 && (
            <div>
              <p className="text-xs text-cyan-400 mb-2 font-bold uppercase tracking-wide border-l-4 border-cyan-400 pl-3">
                {t('itemCard.explicitMods')} ({item.explicitMods.length})
              </p>
              <div className="space-y-1.5 pl-5">
                {(showAllExplicits ? item.explicitMods : item.explicitMods.slice(0, 4)).map((mod, i) => (
                  <p key={i} className={`text-sm font-medium ${mod.fractured ? 'text-yellow-300' : 'text-cyan-200'}`}>
                    {mod.fractured && (
                      <span className="text-xs bg-yellow-900/60 border border-yellow-400 px-2 py-0.5 rounded mr-2">[{t('itemCard.fractured')}]</span>
                    )}
                    {mod.text}
                  </p>
                ))}
                {item.explicitMods.length > 4 && (
                  <button
                    onClick={() => setShowAllExplicits(!showAllExplicits)}
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors mt-2 font-semibold"
                  >
                    {showAllExplicits ? (
                      <>
                        <ChevronUp size={14} />
                        {t('itemCard.showLess')}
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} />
                        {t('itemCard.showAll')} ({item.explicitMods.length})
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ItemCard;
