// src/utils/rarityColors.js

export const getRarityColor = (rarity) => {
  switch (rarity) {
    case 'unique': return 'text-orange-400';
    case 'rare': return 'text-yellow-400';
    case 'magic': return 'text-blue-400';
    case 'normal': return 'text-white';
    default: return 'text-slate-300';
  }
};
