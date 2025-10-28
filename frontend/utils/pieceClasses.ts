export interface PieceClass {
  id: string;
  name: string;
  flag: string;
  manIcon: string;
  kingIcon: string;
  description: string;
  color: string;
  manImage?: any; // Image source for man piece
  kingImage?: any; // Image source for king piece
  hasCustomImage?: boolean; // Flag to indicate if custom image is available
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
    hasCustomImage: false,
  },
  european: {
    id: 'european',
    name: 'European Knights',
    flag: '⚔️',
    manIcon: '🛡️',
    kingIcon: '♔',
    description: 'Medieval warriors with honor and strength',
    color: '#4169E1',
    hasCustomImage: false,
  },
  dbz: {
    id: 'dbz',
    name: 'Dragon Ball Z',
    flag: '🐉',
    manIcon: '⚡',
    kingIcon: '💫',
    description: 'Super Saiyans and powerful fighters',
    color: '#FF8C00',
    manImage: require('../assets/pieces/dbz-pieces.png'),
    kingImage: require('../assets/pieces/dbz-pieces.png'),
    hasCustomImage: true,
  },
  sailormoon: {
    id: 'sailormoon',
    name: 'Sailor Moon',
    flag: '🌙',
    manIcon: '✨',
    kingIcon: '🌟',
    description: 'Magical guardians of love and justice',
    color: '#FF69B4',
    hasCustomImage: false,
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
