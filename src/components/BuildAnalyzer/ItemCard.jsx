// src/components/BuildAnalyzer/ItemCard.jsx
import React, { useState, memo } from 'react';
import { Edit2, Copy, Check, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { getRarityColor } from '../../utils/rarityColors';
import { useLanguage } from '../../i18n/LanguageContext';

const ItemCard = memo(({ item, index, copiedIndex, onEdit, onCopy, onOpenTrade }) => {
  const { t } = useLanguage();
  const [showAllEnchants, setShowAllEnchants] = useState(false);
  const [showAllImplicits, setShowAllImplicits] = useState(false);
  const [showAllExplicits, setShowAllExplicits] = useState(false);

  return (
    <div className="bg-slate-900/50 border-2 border-slate-700 rounded-xl p-4 sm:p-6 hover:border-cyan-500/50 transition-all duration-200 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className={`text-xl sm:text-2xl font-bold mb-1 ${getRarityColor(item.rarity)} truncate`}>{item.name}</h3>
          {item.name !== item.baseType && (
            <p className="text-sm text-slate-400 truncate">{item.baseType}</p>
          )}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
            <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-800 border border-slate-600 sm:border-2 rounded-md capitalize text-xs font-bold text-slate-300">
              {item.rarity}
            </span>
            {item.ilvl && (
              <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-800 border border-slate-600 sm:border-2 rounded-md text-xs font-bold text-slate-300">
                iLvl {item.ilvl}
              </span>
            )}
            {item.levelReq > 0 && (
              <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-900/50 border border-blue-500 sm:border-2 text-blue-300 rounded-md text-xs font-bold">
                Req {item.levelReq}
              </span>
            )}
            {item.corrupted && (
              <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-900/50 border border-red-500 sm:border-2 text-red-300 rounded-md text-xs font-bold">
                {t('itemCard.corrupted')}
              </span>
            )}
            {item.socketCount > 0 && (
              <div className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-900/50 border border-purple-500 sm:border-2 rounded-md">
                {Array.from({ length: item.socketCount }).map((_, i) => (
                  <span key={i} className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-purple-400 border border-purple-300 sm:border-2"></span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0 self-end sm:self-start">
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
}, (prevProps, nextProps) => {
  // Custom comparator: only re-render when these props actually change
  // IMPORTANT: Must include filters to ensure trade URL uses updated values
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.index === nextProps.index &&
    prevProps.copiedIndex === nextProps.copiedIndex &&
    // Compare item content that affects rendering
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.rarity === nextProps.item.rarity &&
    prevProps.item.ilvl === nextProps.item.ilvl &&
    prevProps.item.corrupted === nextProps.item.corrupted &&
    prevProps.item.enchantMods.length === nextProps.item.enchantMods.length &&
    prevProps.item.implicitMods.length === nextProps.item.implicitMods.length &&
    prevProps.item.explicitMods.length === nextProps.item.explicitMods.length &&
    // Compare filters that affect trade URL generation
    prevProps.item.filters === nextProps.item.filters
  );
});

export default ItemCard;
