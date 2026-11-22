import React from 'react';
import { ChevronRight, Disc3 } from 'lucide-react';
import type { LibraryHomeCard } from '../../library/core/home/homeModel.contract';
import { getSizedCoverUrl } from '../../utils/coverUrl';
import type { MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/MinimalistCardList.tsx
// Flat static library card row list reused across online, local, and Navidrome sections in Minimalist Mode.

type MinimalistCardListProps = {
    items: LibraryHomeCard[];
    palette: MinimalistThemePalette;
    emptyText: string;
    onOpen: (card: LibraryHomeCard) => void;
};

const MinimalistCardList: React.FC<MinimalistCardListProps> = ({ items, palette, emptyText, onOpen }) => {
    if (items.length === 0) {
        return <div className="py-12 text-center text-sm" style={{ color: palette.textSecondary }}>{emptyText}</div>;
    }

    return (
        <div className="space-y-2">
            {items.map((card, index) => {
                const coverUrl = getSizedCoverUrl(card.coverUrl, 256);
                const subtitle = card.albumArtist || card.description || card.summary;
                return (
                    <button
                        key={`${card.id}-${index}`}
                        type="button"
                        onClick={() => onOpen(card)}
                        className="w-full flex items-center gap-3 rounded-xl border p-2.5 text-left"
                        style={{ backgroundColor: palette.surfaceBg, borderColor: palette.borderColor }}
                    >
                        <div className="w-12 h-12 rounded-lg shrink-0 overflow-hidden flex items-center justify-center" style={{ backgroundColor: palette.mutedBg }}>
                            {coverUrl ? (
                                <img src={coverUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                            ) : (
                                <Disc3 size={20} style={{ color: palette.textSecondary }} />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate" style={{ color: palette.textPrimary }}>{card.name}</div>
                            <div className="text-xs truncate mt-0.5" style={{ color: palette.textSecondary }}>
                                {subtitle || (card.trackCount !== undefined ? `${card.trackCount}` : '')}
                            </div>
                        </div>
                        <ChevronRight size={16} style={{ color: palette.textSecondary }} />
                    </button>
                );
            })}
        </div>
    );
};

export default MinimalistCardList;
