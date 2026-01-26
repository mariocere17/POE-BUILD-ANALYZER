// src/components/BuildAnalyzer/EditItemModal.jsx
import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { RARITY_OPTIONS } from '../../utils/constants';
import { useLanguage } from '../../i18n/LanguageContext';

const EditItemModal = ({ item, onClose, onSave }) => {
  const { t } = useLanguage();
  // Deep copy filters and ensure fracturedModIndex, defenceFilters and socketFilters exist
  const [editedItem, setEditedItem] = useState(() => ({
    ...item,
    filters: {
      ...item.filters,
      fracturedModIndex: item.filters.fracturedModIndex ?? null,
      defenceFilters: item.filters.defenceFilters ?? {
        energyShield: { min: null, max: null, enabled: false },
        armour: { min: null, max: null, enabled: false },
        evasion: { min: null, max: null, enabled: false }
      },
      socketFilters: item.filters.socketFilters ?? null
    }
  }));

  // Check if item has any defence properties
  const hasDefenceProperties = item.defenceProperties && (
    item.defenceProperties.energyShield !== null ||
    item.defenceProperties.armour !== null ||
    item.defenceProperties.evasion !== null
  );

  // Check if item has socket info (PoE1 style sockets)
  const hasSocketInfo = item.socketInfo !== null && item.socketInfo !== undefined;

  // Calculate max available sockets for a color based on other enabled colors
  const getMaxForColor = (color) => {
    if (!hasSocketInfo || !editedItem.filters.socketFilters) return 0;
    const maxTotal = item.socketInfo.totalSockets;
    const colors = ['r', 'g', 'b', 'w'];
    const otherColorsSum = colors
      .filter(c => c !== color)
      .reduce((sum, c) => {
        const filter = editedItem.filters.socketFilters[c];
        return sum + (filter.enabled && filter.min ? filter.min : 0);
      }, 0);
    return Math.max(0, maxTotal - otherColorsSum);
  };

  // Track which sections are expanded (all expanded by default)
  const [expandedSections, setExpandedSections] = useState({
    sockets: true,
    defence: true,
    enchants: true,
    implicits: true,
    explicits: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

  const handleFracturedToggle = (index) => {
    // If clicking the already selected one, deselect it (set to null)
    // Otherwise, select the new one
    const newIndex = editedItem.filters.fracturedModIndex === index ? null : index;
    setEditedItem({
      ...editedItem,
      filters: { ...editedItem.filters, fracturedModIndex: newIndex }
    });
  };

  const handleDefenceFilterChange = (defenceType, field, value) => {
    const currentFilter = editedItem.filters.defenceFilters[defenceType];
    const newFilter = { ...currentFilter };

    if (field === 'enabled') {
      newFilter.enabled = value;
    } else {
      newFilter[field] = value ? parseInt(value) : null;
    }

    setEditedItem({
      ...editedItem,
      filters: {
        ...editedItem.filters,
        defenceFilters: {
          ...editedItem.filters.defenceFilters,
          [defenceType]: newFilter
        }
      }
    });
  };

  const handleSocketFilterChange = (socketType, field, value) => {
    if (!editedItem.filters.socketFilters) return;

    const currentFilter = editedItem.filters.socketFilters[socketType];
    const newFilter = { ...currentFilter };

    if (field === 'enabled') {
      newFilter.enabled = value;
    } else {
      // Parse and clamp value to valid range
      let parsedValue = value ? parseInt(value) : null;
      if (parsedValue !== null && item.socketInfo) {
        const maxTotal = item.socketInfo.totalSockets;

        if (socketType === 'links') {
          // Links: clamp between 1 and totalSockets
          parsedValue = Math.max(1, Math.min(parsedValue, maxTotal));
        } else {
          // Socket colors: sum of all enabled colors cannot exceed totalSockets
          const colors = ['r', 'g', 'b', 'w'];
          const otherColorsSum = colors
            .filter(c => c !== socketType)
            .reduce((sum, c) => {
              const filter = editedItem.filters.socketFilters[c];
              return sum + (filter.enabled && filter.min ? filter.min : 0);
            }, 0);

          // Max for this color is totalSockets minus other enabled colors
          const maxForThisColor = Math.max(0, maxTotal - otherColorsSum);
          parsedValue = Math.max(0, Math.min(parsedValue, maxForThisColor));
        }
      }
      newFilter[field] = parsedValue;
    }

    setEditedItem({
      ...editedItem,
      filters: {
        ...editedItem.filters,
        socketFilters: {
          ...editedItem.filters.socketFilters,
          [socketType]: newFilter
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/40 rounded-xl max-w-3xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col shadow-2xl shadow-cyan-500/20">
        <div className="bg-slate-900/90 border-b border-cyan-500/30 p-4 sm:p-6 flex justify-between items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-xl sm:text-2xl font-bold text-cyan-400 truncate">{item.name}</h3>
            {item.name !== item.baseType && (
              <p className="text-sm text-slate-400 mt-1 truncate">{item.baseType}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-cyan-400 transition-colors duration-200 flex-shrink-0">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1 bg-slate-950 custom-scrollbar">
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

          {/* Defence Filters Section */}
          {hasDefenceProperties && (
            <div>
              <button
                type="button"
                onClick={() => toggleSection('defence')}
                className="w-full flex items-center justify-between text-sm text-blue-400 font-bold mb-3 uppercase tracking-wide border-l-4 border-blue-400 pl-3 pr-2 py-1 hover:bg-slate-800/50 rounded-r transition-colors"
              >
                <span>{t('editModal.equipmentFilters')}</span>
                <ChevronDown
                  size={20}
                  className={`transition-transform duration-200 ${expandedSections.defence ? '' : '-rotate-90'}`}
                />
              </button>
              {expandedSections.defence && (
                <div className="space-y-2">
                  {/* Energy Shield */}
                  {item.defenceProperties?.energyShield !== null && (
                    <div className="bg-slate-800/60 border-l-2 border-blue-500/50 p-3 rounded hover:bg-slate-800 transition-all">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={editedItem.filters.defenceFilters.energyShield.enabled}
                          onChange={(e) => handleDefenceFilterChange('energyShield', 'enabled', e.target.checked)}
                          className="w-5 h-5 cursor-pointer accent-blue-500 flex-shrink-0"
                        />
                        <span className="flex-1 text-sm text-blue-100 font-medium">
                          {t('editModal.energyShield')} <span className="text-slate-400">({item.defenceProperties.energyShield})</span>
                        </span>
                      </div>
                      {editedItem.filters.defenceFilters.energyShield.enabled && (
                        <div className="flex gap-2 mt-2 ml-8">
                          <input
                            type="number"
                            placeholder={t('editModal.minPlaceholder')}
                            value={editedItem.filters.defenceFilters.energyShield.min || ''}
                            onChange={(e) => handleDefenceFilterChange('energyShield', 'min', e.target.value)}
                            className="w-20 sm:w-24 bg-slate-700 border border-slate-600 sm:border-2 rounded px-2 sm:px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                          />
                          <input
                            type="number"
                            placeholder={t('editModal.maxPlaceholder')}
                            value={editedItem.filters.defenceFilters.energyShield.max || ''}
                            onChange={(e) => handleDefenceFilterChange('energyShield', 'max', e.target.value)}
                            className="w-20 sm:w-24 bg-slate-700 border border-slate-600 sm:border-2 rounded px-2 sm:px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Armour */}
                  {item.defenceProperties?.armour !== null && (
                    <div className="bg-slate-800/60 border-l-2 border-blue-500/50 p-3 rounded hover:bg-slate-800 transition-all">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={editedItem.filters.defenceFilters.armour.enabled}
                          onChange={(e) => handleDefenceFilterChange('armour', 'enabled', e.target.checked)}
                          className="w-5 h-5 cursor-pointer accent-blue-500 flex-shrink-0"
                        />
                        <span className="flex-1 text-sm text-blue-100 font-medium">
                          {t('editModal.armour')} <span className="text-slate-400">({item.defenceProperties.armour})</span>
                        </span>
                      </div>
                      {editedItem.filters.defenceFilters.armour.enabled && (
                        <div className="flex gap-2 mt-2 ml-8">
                          <input
                            type="number"
                            placeholder={t('editModal.minPlaceholder')}
                            value={editedItem.filters.defenceFilters.armour.min || ''}
                            onChange={(e) => handleDefenceFilterChange('armour', 'min', e.target.value)}
                            className="w-20 sm:w-24 bg-slate-700 border border-slate-600 sm:border-2 rounded px-2 sm:px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                          />
                          <input
                            type="number"
                            placeholder={t('editModal.maxPlaceholder')}
                            value={editedItem.filters.defenceFilters.armour.max || ''}
                            onChange={(e) => handleDefenceFilterChange('armour', 'max', e.target.value)}
                            className="w-20 sm:w-24 bg-slate-700 border border-slate-600 sm:border-2 rounded px-2 sm:px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Evasion */}
                  {item.defenceProperties?.evasion !== null && (
                    <div className="bg-slate-800/60 border-l-2 border-blue-500/50 p-3 rounded hover:bg-slate-800 transition-all">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={editedItem.filters.defenceFilters.evasion.enabled}
                          onChange={(e) => handleDefenceFilterChange('evasion', 'enabled', e.target.checked)}
                          className="w-5 h-5 cursor-pointer accent-blue-500 flex-shrink-0"
                        />
                        <span className="flex-1 text-sm text-blue-100 font-medium">
                          {t('editModal.evasion')} <span className="text-slate-400">({item.defenceProperties.evasion})</span>
                        </span>
                      </div>
                      {editedItem.filters.defenceFilters.evasion.enabled && (
                        <div className="flex gap-2 mt-2 ml-8">
                          <input
                            type="number"
                            placeholder={t('editModal.minPlaceholder')}
                            value={editedItem.filters.defenceFilters.evasion.min || ''}
                            onChange={(e) => handleDefenceFilterChange('evasion', 'min', e.target.value)}
                            className="w-20 sm:w-24 bg-slate-700 border border-slate-600 sm:border-2 rounded px-2 sm:px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                          />
                          <input
                            type="number"
                            placeholder={t('editModal.maxPlaceholder')}
                            value={editedItem.filters.defenceFilters.evasion.max || ''}
                            onChange={(e) => handleDefenceFilterChange('evasion', 'max', e.target.value)}
                            className="w-20 sm:w-24 bg-slate-700 border border-slate-600 sm:border-2 rounded px-2 sm:px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Socket Filters Section (PoE1 only) */}
          {hasSocketInfo && editedItem.filters.socketFilters && (
            <div>
              <button
                type="button"
                onClick={() => toggleSection('sockets')}
                className="w-full flex items-center justify-between text-sm text-purple-400 font-bold mb-3 uppercase tracking-wide border-l-4 border-purple-400 pl-3 pr-2 py-1 hover:bg-slate-800/50 rounded-r transition-colors"
              >
                <span>{t('editModal.socketFilters')} <span className="text-slate-400 font-normal">({item.socketInfo.raw})</span></span>
                <ChevronDown
                  size={20}
                  className={`transition-transform duration-200 ${expandedSections.sockets ? '' : '-rotate-90'}`}
                />
              </button>
              {expandedSections.sockets && (
                <div className="space-y-2">
                  {/* Socket Colors */}
                  <div className="bg-slate-800/60 border-l-2 border-purple-500/50 p-3 rounded">
                    <div className="text-sm text-purple-200 font-medium mb-2">{t('editModal.socketColors')}</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {/* Red Sockets */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editedItem.filters.socketFilters.r.enabled}
                          onChange={(e) => handleSocketFilterChange('r', 'enabled', e.target.checked)}
                          className="w-4 h-4 cursor-pointer accent-red-500"
                        />
                        <span className="text-red-400 font-bold text-sm">R</span>
                        <input
                          type="number"
                          min="0"
                          max={getMaxForColor('r')}
                          placeholder="Min"
                          value={editedItem.filters.socketFilters.r.min || ''}
                          onChange={(e) => handleSocketFilterChange('r', 'min', e.target.value)}
                          disabled={!editedItem.filters.socketFilters.r.enabled}
                          className="w-14 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
                        />
                        <span className="text-slate-500 text-xs">({item.socketInfo.colors.r})</span>
                      </div>
                      {/* Green Sockets */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editedItem.filters.socketFilters.g.enabled}
                          onChange={(e) => handleSocketFilterChange('g', 'enabled', e.target.checked)}
                          className="w-4 h-4 cursor-pointer accent-green-500"
                        />
                        <span className="text-green-400 font-bold text-sm">G</span>
                        <input
                          type="number"
                          min="0"
                          max={getMaxForColor('g')}
                          placeholder="Min"
                          value={editedItem.filters.socketFilters.g.min || ''}
                          onChange={(e) => handleSocketFilterChange('g', 'min', e.target.value)}
                          disabled={!editedItem.filters.socketFilters.g.enabled}
                          className="w-14 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-green-500 disabled:opacity-50"
                        />
                        <span className="text-slate-500 text-xs">({item.socketInfo.colors.g})</span>
                      </div>
                      {/* Blue Sockets */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editedItem.filters.socketFilters.b.enabled}
                          onChange={(e) => handleSocketFilterChange('b', 'enabled', e.target.checked)}
                          className="w-4 h-4 cursor-pointer accent-blue-500"
                        />
                        <span className="text-blue-400 font-bold text-sm">B</span>
                        <input
                          type="number"
                          min="0"
                          max={getMaxForColor('b')}
                          placeholder="Min"
                          value={editedItem.filters.socketFilters.b.min || ''}
                          onChange={(e) => handleSocketFilterChange('b', 'min', e.target.value)}
                          disabled={!editedItem.filters.socketFilters.b.enabled}
                          className="w-14 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        />
                        <span className="text-slate-500 text-xs">({item.socketInfo.colors.b})</span>
                      </div>
                      {/* White Sockets */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editedItem.filters.socketFilters.w.enabled}
                          onChange={(e) => handleSocketFilterChange('w', 'enabled', e.target.checked)}
                          className="w-4 h-4 cursor-pointer accent-slate-300"
                        />
                        <span className="text-slate-200 font-bold text-sm">W</span>
                        <input
                          type="number"
                          min="0"
                          max={getMaxForColor('w')}
                          placeholder="Min"
                          value={editedItem.filters.socketFilters.w.min || ''}
                          onChange={(e) => handleSocketFilterChange('w', 'min', e.target.value)}
                          disabled={!editedItem.filters.socketFilters.w.enabled}
                          className="w-14 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-slate-400 disabled:opacity-50"
                        />
                        <span className="text-slate-500 text-xs">({item.socketInfo.colors.w})</span>
                      </div>
                    </div>
                  </div>
                  {/* Links */}
                  <div className="bg-slate-800/60 border-l-2 border-purple-500/50 p-3 rounded">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={editedItem.filters.socketFilters.links.enabled}
                        onChange={(e) => handleSocketFilterChange('links', 'enabled', e.target.checked)}
                        className="w-5 h-5 cursor-pointer accent-purple-500"
                      />
                      <span className="text-sm text-purple-200 font-medium">{t('editModal.minLinks')}</span>
                      <input
                        type="number"
                        min="1"
                        max={item.socketInfo.totalSockets}
                        placeholder="Min"
                        value={editedItem.filters.socketFilters.links.min || ''}
                        onChange={(e) => handleSocketFilterChange('links', 'min', e.target.value)}
                        disabled={!editedItem.filters.socketFilters.links.enabled}
                        className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                      />
                      <span className="text-slate-400 text-sm">({t('editModal.currentLinks')}: {item.socketInfo.maxLinks})</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {editedItem.enchantMods.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => toggleSection('enchants')}
                className="w-full flex items-center justify-between text-sm text-teal-400 font-bold mb-3 uppercase tracking-wide border-l-4 border-teal-400 pl-3 pr-2 py-1 hover:bg-slate-800/50 rounded-r transition-colors"
              >
                <span>{t('itemCard.enchants')} ({editedItem.enchantMods.filter((_, i) => editedItem.filters.selectedEnchants[i]).length} {t('editModal.enchantsSelected')})</span>
                <ChevronDown
                  size={20}
                  className={`transition-transform duration-200 ${expandedSections.enchants ? '' : '-rotate-90'}`}
                />
              </button>
              {expandedSections.enchants && (
              <div className="space-y-2">
                {editedItem.enchantMods.map((mod, i) => (
                  <div key={i} className="bg-slate-800/60 border-l-2 border-teal-500/50 p-3 rounded hover:bg-slate-800 transition-all">
                    {/* Row 1: Checkbox and mod text */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={editedItem.filters.selectedEnchants[i]}
                        onChange={(e) => handleModToggle('enchant', i, e.target.checked)}
                        className="w-5 h-5 cursor-pointer accent-teal-500 flex-shrink-0"
                      />
                      <span className="flex-1 text-sm text-teal-100 font-medium">{mod.normalized}</span>
                    </div>
                    {/* Row 2: Value inputs */}
                    {mod.value !== null && (
                      <div className="flex gap-2 mt-2 ml-8">
                        <input
                          type="number"
                          placeholder={t('editModal.minPlaceholder')}
                          defaultValue={mod.value}
                          onChange={(e) => handleValueChange('enchant', i, 'min', e.target.value)}
                          className="w-16 sm:w-20 bg-slate-700 border border-slate-600 sm:border-2 rounded px-2 sm:px-3 py-1.5 text-sm text-white focus:outline-none focus:border-teal-500"
                        />
                        <input
                          type="number"
                          placeholder={t('editModal.maxPlaceholder')}
                          onChange={(e) => handleValueChange('enchant', i, 'max', e.target.value)}
                          className="w-16 sm:w-20 bg-slate-700 border border-slate-600 sm:border-2 rounded px-2 sm:px-3 py-1.5 text-sm text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {editedItem.implicitMods.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => toggleSection('implicits')}
                className="w-full flex items-center justify-between text-sm text-emerald-400 font-bold mb-3 uppercase tracking-wide border-l-4 border-emerald-400 pl-3 pr-2 py-1 hover:bg-slate-800/50 rounded-r transition-colors"
              >
                <span>{t('itemCard.implicitMods')} ({editedItem.implicitMods.filter((_, i) => editedItem.filters.selectedImplicits[i]).length} {t('editModal.implicitsSelected')})</span>
                <ChevronDown
                  size={20}
                  className={`transition-transform duration-200 ${expandedSections.implicits ? '' : '-rotate-90'}`}
                />
              </button>
              {expandedSections.implicits && (
              <div className="space-y-2">
                {editedItem.implicitMods.map((mod, i) => (
                  <div key={i} className="bg-slate-800/60 border-l-2 border-emerald-500/50 p-3 rounded hover:bg-slate-800 transition-all">
                    {/* Row 1: Checkbox and mod text */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={editedItem.filters.selectedImplicits[i]}
                        onChange={(e) => handleModToggle('implicit', i, e.target.checked)}
                        className="w-5 h-5 cursor-pointer accent-emerald-500 flex-shrink-0"
                      />
                      <span className="flex-1 text-sm text-emerald-100 font-medium">{mod.normalized}</span>
                    </div>
                    {/* Row 2: Value inputs */}
                    {mod.value !== null && (
                      <div className="flex gap-2 mt-2 ml-8">
                        <input
                          type="number"
                          placeholder={t('editModal.minPlaceholder')}
                          defaultValue={mod.value}
                          onChange={(e) => handleValueChange('implicit', i, 'min', e.target.value)}
                          className="w-16 sm:w-20 bg-slate-700 border border-slate-600 sm:border-2 rounded px-2 sm:px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                        <input
                          type="number"
                          placeholder={t('editModal.maxPlaceholder')}
                          onChange={(e) => handleValueChange('implicit', i, 'max', e.target.value)}
                          className="w-16 sm:w-20 bg-slate-700 border border-slate-600 sm:border-2 rounded px-2 sm:px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {editedItem.explicitMods.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => toggleSection('explicits')}
                className="w-full flex items-center justify-between text-sm text-cyan-400 font-bold mb-3 uppercase tracking-wide border-l-4 border-cyan-400 pl-3 pr-2 py-1 hover:bg-slate-800/50 rounded-r transition-colors"
              >
                <span>{t('itemCard.explicitMods')} ({editedItem.explicitMods.filter((_, i) => editedItem.filters.selectedExplicits[i]).length} {t('editModal.explicitsSelected')})</span>
                <ChevronDown
                  size={20}
                  className={`transition-transform duration-200 ${expandedSections.explicits ? '' : '-rotate-90'}`}
                />
              </button>
              {expandedSections.explicits && (
              <div className="space-y-2">
                {editedItem.explicitMods.map((mod, i) => (
                  <div key={i} className={`bg-slate-800/60 p-3 rounded hover:bg-slate-800 transition-all ${editedItem.filters.fracturedModIndex === i ? 'border-l-2 border-amber-500' : 'border-l-2 border-cyan-500/50'}`}>
                    {/* Row 1: Checkbox and mod text */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={editedItem.filters.selectedExplicits[i]}
                        onChange={(e) => handleModToggle('explicit', i, e.target.checked)}
                        className="w-5 h-5 cursor-pointer accent-cyan-500 flex-shrink-0"
                      />
                      <span className={`flex-1 text-sm font-medium ${editedItem.filters.fracturedModIndex === i ? 'text-amber-300' : 'text-cyan-100'}`}>{mod.normalized}</span>
                    </div>
                    {/* Row 2: Value inputs and Fractured button */}
                    <div className="flex items-center gap-2 mt-2 ml-8">
                      {mod.value !== null && (
                        <>
                          <input
                            type="number"
                            placeholder={t('editModal.minPlaceholder')}
                            defaultValue={mod.value}
                            onChange={(e) => handleValueChange('explicit', i, 'min', e.target.value)}
                            className="w-16 sm:w-20 bg-slate-700 border border-slate-600 sm:border-2 rounded px-2 sm:px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                          />
                          <input
                            type="number"
                            placeholder={t('editModal.maxPlaceholder')}
                            onChange={(e) => handleValueChange('explicit', i, 'max', e.target.value)}
                            className="w-16 sm:w-20 bg-slate-700 border border-slate-600 sm:border-2 rounded px-2 sm:px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                          />
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleFracturedToggle(i)}
                        title={t('editModal.fracturedTooltip')}
                        className={`ml-auto px-2 py-1 text-xs font-bold rounded border transition-all flex-shrink-0 ${
                          editedItem.filters.fracturedModIndex === i
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-amber-500/50 hover:text-amber-400'
                        }`}
                      >
                        {t('editModal.fractured')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-slate-900/90 border-t border-cyan-500/30 p-4 sm:p-6 flex gap-2 sm:gap-3">
          <button
            onClick={() => {
              onSave(editedItem);
              onClose();
            }}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold uppercase tracking-wide text-sm sm:text-base transition-all duration-200 shadow-lg shadow-cyan-500/30"
          >
            {t('editModal.saveChanges')}
          </button>
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 text-slate-200 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200"
          >
            {t('editModal.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditItemModal;
