// src/utils/rarityColors.js

export const getRarityColor = (rarity) => {
  const rarityLower = rarity?.toLowerCase();
  switch (rarityLower) {
    case 'unique':
    case 'relic': // Relics are unique items from past leagues
      return 'text-orange-400';
    case 'rare': return 'text-yellow-400';
    case 'magic': return 'text-blue-400';
    case 'normal': return 'text-white';
    default: return 'text-slate-300';
  }
};
