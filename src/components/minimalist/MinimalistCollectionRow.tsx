import type { RowComponentProps } from 'react-window';
import { Plus, PlusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SongResult } from '../../types';
import { getSongArtistLabel, getSongDurationMs } from '../../services/onlineMusic/songMetadata';
import { formatTime } from '../../utils/appPlaybackHelpers';
import { isSamePlaybackSong } from '../../utils/appPlaybackGuards';
import type { MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/MinimalistCollectionRow.tsx
// Virtualized track row renderer shared by Minimalist collection and playlist views.

export type CollectionTrackRowData = {
    tracks: SongResult[];
    currentSong: SongResult | null;
    palette: MinimalistThemePalette;
    onPlayTrack: (track: SongResult) => void;
    onEnqueueTrack: (track: SongResult) => void;
    onSaveTrack: (track: SongResult) => void;
    canSaveTrack: (track: SongResult) => boolean;
};

export const COLLECTION_TRACK_ROW_HEIGHT = 58;

export const MinimalistCollectionRow = ({
    index,
    style,
    ariaAttributes,
    tracks,
    currentSong,
    palette,
    onPlayTrack,
    onEnqueueTrack,
    onSaveTrack,
    canSaveTrack,
}: RowComponentProps<CollectionTrackRowData>) => {
    const { t } = useTranslation();
    const track = tracks[index];
    const isPlaying = isSamePlaybackSong(track, currentSong);
    const artistLabel = getSongArtistLabel(track);
    const durationSec = Math.round(getSongDurationMs(track) / 1000);

    return (
        <div
            {...ariaAttributes}
            style={{ ...style, borderBottom: `1px solid ${palette.borderColor}` }}
            className="flex items-center gap-2.5 px-4"
        >
            <button
                type="button"
                onClick={() => onPlayTrack(track)}
                className="min-w-0 flex-1 flex items-center gap-3 text-left py-2"
            >
                <span
                    className="w-6 text-center text-xs tabular-nums shrink-0"
                    style={{ color: isPlaying ? palette.accentColor : palette.textSecondary }}
                >
                    {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                    <div
                        className="text-sm font-medium truncate"
                        style={{ color: isPlaying ? palette.accentColor : palette.textPrimary }}
                    >
                        {track.name}
                    </div>
                    <div className="text-xs truncate" style={{ color: palette.textSecondary }}>
                        {artistLabel}{durationSec > 0 ? ` · ${formatTime(durationSec)}` : ''}
                    </div>
                </div>
            </button>
            {canSaveTrack(track) && (
                <button
                    type="button"
                    aria-label={t('minimalist.player.addToPlaylist')}
                    onClick={() => onSaveTrack(track)}
                    className="p-2 rounded-lg shrink-0"
                    style={{ color: palette.textSecondary }}
                >
                    <PlusCircle size={15} />
                </button>
            )}
            <button
                type="button"
                aria-label={t('minimalist.player.addToQueue')}
                onClick={() => onEnqueueTrack(track)}
                className="p-2 rounded-lg shrink-0"
                style={{ color: palette.textSecondary }}
            >
                <Plus size={15} />
            </button>
        </div>
    );
};
