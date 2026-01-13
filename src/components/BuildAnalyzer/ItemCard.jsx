// src/components/BuildAnalyzer/ItemCard.jsx
import React from 'react';
import { Edit2, Copy, Check, ExternalLink } from 'lucide-react';
import { getRarityColor } from '../../utils/rarityColors';

const ItemCard = ({ item, index, copiedIndex, onEdit, onCopy, onOpenTrade }) => {
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
            {item.levelReq && (
              <span className="px-3 py-1.5 bg-blue-900/50 border-2 border-blue-500 text-blue-300 rounded-md text-xs font-bold">
                Req Lvl {item.levelReq}
              </span>
            )}
            {item.corrupted && (
              <span className="px-3 py-1.5 bg-red-900/50 border-2 border-red-500 text-red-300 rounded-md text-xs font-bold">
                Corrupted
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
            title="Edit filters"
          >
            <Edit2 size={20} className="text-cyan-400" />
          </button>
          <button
            onClick={() => onCopy(item, index)}
            className="p-3 bg-slate-800 hover:bg-emerald-500/20 border-2 border-slate-600 hover:border-emerald-500 rounded-lg transition-all duration-200 flex-shrink-0"
            title="Copy URL"
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
            title="Search in Trade"
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
                Enchants ({item.enchantMods.length})
              </p>
              <div className="space-y-1.5 pl-5">
                {item.enchantMods.slice(0, 3).map((mod, i) => (
                  <p key={i} className="text-sm text-teal-200 font-medium">
                    {mod.hasAllocates && (
                      <span className="text-xs bg-green-900/60 border border-green-400 px-2 py-0.5 rounded mr-2">[ALLOCATES]</span>
                    )}
                    {mod.isRuneEnchant && (
                      <span className="text-xs bg-teal-900/60 border border-teal-400 px-2 py-0.5 rounded mr-2">[RUNE]</span>
                    )}
                    {!mod.isRuneEnchant && !mod.hasAllocates && (
                      <span className="text-xs bg-teal-900/60 border border-teal-400 px-2 py-0.5 rounded mr-2">[ENCHANT]</span>
                    )}
                    {mod.text}
                  </p>
                ))}
                {item.enchantMods.length > 3 && (
                  <p className="text-xs text-slate-500 italic">
                    ...and {item.enchantMods.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}

          {item.implicitMods.length > 0 && (
            <div>
              <p className="text-xs text-emerald-400 mb-2 font-bold uppercase tracking-wide border-l-4 border-emerald-400 pl-3">
                Implicit Mods ({item.implicitMods.length})
              </p>
              <div className="space-y-1.5 pl-5">
                {item.implicitMods.slice(0, 3).map((mod, i) => (
                  <p key={i} className={`text-sm font-medium ${mod.fractured ? 'text-yellow-300' : 'text-emerald-200'}`}>
                    {mod.fractured && (
                      <span className="text-xs bg-yellow-900/60 border border-yellow-400 px-2 py-0.5 rounded mr-2">[FRACTURED]</span>
                    )}
                    {!mod.fractured && (
                      <span className="text-xs bg-emerald-900/60 border border-emerald-400 px-2 py-0.5 rounded mr-2">[IMPLICIT]</span>
                    )}
                    {mod.text}
                  </p>
                ))}
                {item.implicitMods.length > 3 && (
                  <p className="text-xs text-slate-500 italic">
                    ...and {item.implicitMods.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}

          {item.explicitMods.length > 0 && (
            <div>
              <p className="text-xs text-cyan-400 mb-2 font-bold uppercase tracking-wide border-l-4 border-cyan-400 pl-3">
                Explicit Mods ({item.explicitMods.length})
              </p>
              <div className="space-y-1.5 pl-5">
                {item.explicitMods.slice(0, 4).map((mod, i) => (
                  <p key={i} className={`text-sm font-medium ${mod.fractured ? 'text-yellow-300' : 'text-cyan-200'}`}>
                    {mod.fractured && (
                      <span className="text-xs bg-yellow-900/60 border border-yellow-400 px-2 py-0.5 rounded mr-2">[FRACTURED]</span>
                    )}
                    {mod.text}
                  </p>
                ))}
                {item.explicitMods.length > 4 && (
                  <p className="text-xs text-slate-500 italic">
                    ...and {item.explicitMods.length - 4} more
                  </p>
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
