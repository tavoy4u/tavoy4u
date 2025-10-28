export interface PieceClass {
  id: string;
  name: string;
  flag: string;
  manIcon: string;
  kingIcon: string;
  description: string;
  color: string;
  manImage?: string; // Will be replaced with actual 2D model URLs
  kingImage?: string; // Will be replaced with actual 2D model URLs
}

export const PIECE_CLASSES: Record<string, PieceClass> = {
  jamaican: {
    id: 'jamaican',
    name: 'Jamaican Warriors',
    flag: '🇯🇲',
    manIcon: '🏝️',
    kingIcon: '👑',
    description: 'Tropical island fighters with vibrant energy',
    color: '#FFD700',
  },
  european: {
    id: 'european',
    name: 'European Knights',
    flag: '⚔️',
    manIcon: '🛡️',
    kingIcon: '♔',
    description: 'Medieval warriors with honor and strength',
    color: '#4169E1',
  },
  dbz: {
    id: 'dbz',
    name: 'Dragon Ball Z',
    flag: '🐉',
    manIcon: '⚡',
    kingIcon: '💫',
    description: 'Super Saiyans and powerful fighters',
    color: '#FF8C00',
  },
  sailormoon: {
    id: 'sailormoon',
    name: 'Sailor Moon',
    flag: '🌙',
    manIcon: '✨',
    kingIcon: '🌟',
    description: 'Magical guardians of love and justice',
    color: '#FF69B4',
  },
};

export const getPieceIcon = (
  classId: string,
  rank: 'man' | 'king'
): string => {
  const pieceClass = PIECE_CLASSES[classId] || PIECE_CLASSES.jamaican;
  return rank === 'king' ? pieceClass.kingIcon : pieceClass.manIcon;
};

export const getPieceClass = (classId: string): PieceClass => {
  return PIECE_CLASSES[classId] || PIECE_CLASSES.jamaican;
};
