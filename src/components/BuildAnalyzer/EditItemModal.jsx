// src/components/BuildAnalyzer/EditItemModal.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { RARITY_OPTIONS } from '../../utils/constants';
import { useLanguage } from '../../i18n/LanguageContext';

const EditItemModal = ({ item, onClose, onSave }) => {
  const { t } = useLanguage();
  const [editedItem, setEditedItem] = useState({ ...item });

  const handleModToggle = (type, index, checked) => {
    const key = type === 'implicit' ? 'selectedImplicits' :
                type === 'enchant' ? 'selectedEnchants' : 'selectedExplicits';
    const newSelected = [...editedItem.filters[key]];
    newSelected[index] = checked;
    setEditedItem({
      ...editedItem,
      filters: { ...editedItem.filters, [key]: newSelected }
    });
  };

  const handleValueChange = (type, index, minOrMax, value) => {
    const key = minOrMax === 'min' ? 'minValues' : 'maxValues';
    const newValues = { ...editedItem.filters[key] };
    const modKey = `${type}_${index}`;
    newValues[modKey] = value ? parseFloat(value) : null;
    setEditedItem({
      ...editedItem,
      filters: { ...editedItem.filters, [key]: newValues }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/40 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl shadow-cyan-500/20">
        <div className="bg-slate-900/90 border-b border-cyan-500/30 p-6 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-cyan-400">{item.name}</h3>
            {item.name !== item.baseType && (
              <p className="text-sm text-slate-400 mt-1">{item.baseType}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-cyan-400 transition-colors duration-200">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-slate-950">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-cyan-400 font-semibold mb-2 uppercase tracking-wide">{t('editModal.itemLevel')}</label>
              <input
                type="number"
                value={editedItem.ilvl || ''}
                onChange={(e) => setEditedItem({ ...editedItem, ilvl: parseInt(e.target.value) || null })}
                className="w-full bg-slate-800/80 border-2 border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-cyan-400 font-semibold mb-2 uppercase tracking-wide">{t('editModal.rarity')}</label>
              <select
                value={editedItem.rarity}
                onChange={(e) => setEditedItem({ ...editedItem, rarity: e.target.value })}
                className="w-full bg-slate-800/80 border-2 border-slate-700 rounded-lg px-4 py-2.5 text-white capitalize focus:outline-none focus:border-cyan-500 transition-all"
              >
                {RARITY_OPTIONS.map(rarity => (
                  <option key={rarity} value={rarity}>{rarity}</option>
                ))}
              </select>
            </div>
          </div>

          {editedItem.enchantMods.length > 0 && (
            <div>
              <label className="block text-sm text-teal-400 font-bold mb-3 uppercase tracking-wide border-l-4 border-teal-400 pl-3">
                {t('itemCard.enchants')} ({editedItem.enchantMods.filter((_, i) => editedItem.filters.selectedEnchants[i]).length} {t('editModal.enchantsSelected')})
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {editedItem.enchantMods.map((mod, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-800/60 border-l-2 border-teal-500/50 p-3 rounded hover:bg-slate-800 transition-all">
                    <input
                      type="checkbox"
                      checked={editedItem.filters.selectedEnchants[i]}
                      onChange={(e) => handleModToggle('enchant', i, e.target.checked)}
                      className="w-5 h-5 cursor-pointer accent-teal-500"
                    />
                    <span className="flex-1 text-sm text-teal-100 font-medium">{mod.normalized}</span>
                    {mod.value !== null && (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder={t('editModal.minPlaceholder')}
                          defaultValue={mod.value}
                          onChange={(e) => handleValueChange('enchant', i, 'min', e.target.value)}
                          className="w-20 bg-slate-700 border-2 border-slate-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-teal-500"
                        />
                        <input
                          type="number"
                          placeholder={t('editModal.maxPlaceholder')}
                          onChange={(e) => handleValueChange('enchant', i, 'max', e.target.value)}
                          className="w-20 bg-slate-700 border-2 border-slate-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {editedItem.implicitMods.length > 0 && (
            <div>
              <label className="block text-sm text-emerald-400 font-bold mb-3 uppercase tracking-wide border-l-4 border-emerald-400 pl-3">
                {t('itemCard.implicitMods')} ({editedItem.implicitMods.filter((_, i) => editedItem.filters.selectedImplicits[i]).length} {t('editModal.implicitsSelected')})
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {editedItem.implicitMods.map((mod, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-800/60 border-l-2 border-emerald-500/50 p-3 rounded hover:bg-slate-800 transition-all">
                    <input
                      type="checkbox"
                      checked={editedItem.filters.selectedImplicits[i]}
                      onChange={(e) => handleModToggle('implicit', i, e.target.checked)}
                      className="w-5 h-5 cursor-pointer accent-emerald-500"
                    />
                    <span className="flex-1 text-sm text-emerald-100 font-medium">{mod.normalized}</span>
                    {mod.value !== null && (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder={t('editModal.minPlaceholder')}
                          defaultValue={mod.value}
                          onChange={(e) => handleValueChange('implicit', i, 'min', e.target.value)}
                          className="w-20 bg-slate-700 border-2 border-slate-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                        <input
                          type="number"
                          placeholder={t('editModal.maxPlaceholder')}
                          onChange={(e) => handleValueChange('implicit', i, 'max', e.target.value)}
                          className="w-20 bg-slate-700 border-2 border-slate-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {editedItem.explicitMods.length > 0 && (
            <div>
              <label className="block text-sm text-cyan-400 font-bold mb-3 uppercase tracking-wide border-l-4 border-cyan-400 pl-3">
                {t('itemCard.explicitMods')} ({editedItem.explicitMods.filter((_, i) => editedItem.filters.selectedExplicits[i]).length} {t('editModal.explicitsSelected')})
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {editedItem.explicitMods.map((mod, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-800/60 border-l-2 border-cyan-500/50 p-3 rounded hover:bg-slate-800 transition-all">
                    <input
                      type="checkbox"
                      checked={editedItem.filters.selectedExplicits[i]}
                      onChange={(e) => handleModToggle('explicit', i, e.target.checked)}
                      className="w-5 h-5 cursor-pointer accent-cyan-500"
                    />
                    <span className="flex-1 text-sm text-cyan-100 font-medium">{mod.normalized}</span>
                    {mod.value !== null && (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder={t('editModal.minPlaceholder')}
                          defaultValue={mod.value}
                          onChange={(e) => handleValueChange('explicit', i, 'min', e.target.value)}
                          className="w-20 bg-slate-700 border-2 border-slate-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                        />
                        <input
                          type="number"
                          placeholder={t('editModal.maxPlaceholder')}
                          onChange={(e) => handleValueChange('explicit', i, 'max', e.target.value)}
                          className="w-20 bg-slate-700 border-2 border-slate-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-900/90 border-t border-cyan-500/30 p-6 flex gap-3">
          <button
            onClick={() => {
              onSave(editedItem);
              onClose();
            }}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wide transition-all duration-200 shadow-lg shadow-cyan-500/30"
          >
            {t('editModal.saveChanges')}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 text-slate-200 rounded-lg font-semibold transition-all duration-200"
          >
            {t('editModal.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditItemModal;
