import React, { useEffect, useMemo } from 'react';
import { List, type RowComponentProps } from 'react-window';
import { ArrowUpToLine, Shuffle, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SongResult } from '../../types';
import { getPlaybackSongKey, isSamePlaybackSong } from '../../utils/appPlaybackGuards';
import { getSongArtistLabel } from '../../services/onlineMusic/songMetadata';
import type { MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/MinimalistQueueSheet.tsx
// Virtualized play queue sheet for Minimalist Mode using `react-window` without heavy blur or spring backdrops.

type MinimalistQueueSheetProps = {
    isOpen: boolean;
    queue: SongResult[];
    currentSong: SongResult | null;
    palette: MinimalistThemePalette;
    onClose: () => void;
    onPlaySong: (song: SongResult) => void;
    onShuffleQueue: () => void;
    onRemoveSong: (index: number) => void;
    onMoveNext: (index: number) => void;
};

type QueueRowData = {
    queue: SongResult[];
    currentSong: SongResult | null;
    palette: MinimalistThemePalette;
    onPlaySong: (song: SongResult) => void;
    onRemoveSong: (index: number) => void;
    onMoveNext: (index: number) => void;
    onClose: () => void;
};

const ROW_HEIGHT = 56;

const QueueRow = ({
    index,
    style,
    ariaAttributes,
    queue,
    currentSong,
    palette,
    onPlaySong,
    onRemoveSong,
    onMoveNext,
    onClose,
}: RowComponentProps<QueueRowData>) => {
    const { t } = useTranslation();
    const song = queue[index];
    const isCurrent = isSamePlaybackSong(song, currentSong);
    const artistLabel = getSongArtistLabel(song);

    return (
        <div
            {...ariaAttributes}
            style={{ ...style, borderBottom: `1px solid ${palette.borderColor}` }}
            className="flex items-center gap-2 px-4"
        >
            <button
                type="button"
                onClick={() => {
                    onPlaySong(song);
                    onClose();
                }}
                className="min-w-0 flex-1 text-left py-2"
            >
                <div
                    className="text-sm font-medium truncate"
                    style={{ color: isCurrent ? palette.accentColor : palette.textPrimary }}
                >
                    {song.name}
                </div>
                <div className="text-xs truncate" style={{ color: palette.textSecondary }}>
                    {artistLabel}
                </div>
            </button>
            {!isCurrent && (
                <button
                    type="button"
                    aria-label={t('minimalist.player.moveNext')}
                    onClick={() => onMoveNext(index)}
                    className="p-2 rounded-lg"
                    style={{ color: palette.textSecondary }}
                >
                    <ArrowUpToLine size={15} />
                </button>
            )}
            <button
                type="button"
                aria-label={t('minimalist.player.removeTrack')}
                onClick={() => onRemoveSong(index)}
                className="p-2 rounded-lg"
                style={{ color: palette.textSecondary }}
            >
                <Trash2 size={15} />
            </button>
        </div>
    );
};

const MinimalistQueueSheet: React.FC<MinimalistQueueSheetProps> = ({
    isOpen,
    queue,
    currentSong,
    palette,
    onClose,
    onPlaySong,
    onShuffleQueue,
    onRemoveSong,
    onMoveNext,
}) => {
    const { t } = useTranslation();

    useEffect(() => {
        if (!isOpen) return undefined;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || event.repeat) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            onClose();
        };
        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, [isOpen, onClose]);

    const rowProps = useMemo<QueueRowData>(() => ({
        queue,
        currentSong,
        palette,
        onPlaySong,
        onRemoveSong,
        onMoveNext,
        onClose,
    }), [currentSong, onClose, onMoveNext, onPlaySong, onRemoveSong, palette, queue]);

    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            data-folia-sheet="true"
            data-folia-keyboard-window="true"
            className="fixed inset-0 z-[130] flex flex-col justify-end sm:items-center sm:justify-center bg-black/55"
            onClick={onClose}
        >
            <div
                onClick={(event) => event.stopPropagation()}
                className="w-full sm:max-w-lg h-[70vh] rounded-t-2xl sm:rounded-2xl border flex flex-col overflow-hidden"
                style={{
                    backgroundColor: palette.surfaceBg,
                    borderColor: palette.borderColor,
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                }}
            >
                <div
                    className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b"
                    style={{ borderColor: palette.borderColor }}
                >
                    <div className="font-semibold text-sm" style={{ color: palette.textPrimary }}>
                        {t('minimalist.player.queueTitle')} ({queue.length})
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={onShuffleQueue}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs"
                            style={{ backgroundColor: palette.mutedBg, color: palette.textPrimary }}
                        >
                            <Shuffle size={14} />
                            <span>{t('minimalist.player.shuffle')}</span>
                        </button>
                        <button
                            type="button"
                            aria-label={t('minimalist.player.close')}
                            onClick={onClose}
                            className="p-1.5 rounded-lg"
                            style={{ color: palette.textSecondary }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
                <div className="min-h-0 flex-1">
                    {queue.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm" style={{ color: palette.textSecondary }}>
                            {t('minimalist.player.emptyQueue')}
                        </div>
                    ) : (
                        <List
                            rowCount={queue.length}
                            rowHeight={ROW_HEIGHT}
                            rowComponent={QueueRow}
                            rowProps={rowProps}
                            overscanCount={6}
                            style={{ height: '100%', width: '100%' }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export { getPlaybackSongKey };
export default MinimalistQueueSheet;
