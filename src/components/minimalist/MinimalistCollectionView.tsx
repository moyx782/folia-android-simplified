import React, { useMemo } from 'react';
import { List } from 'react-window';
import { ArrowLeft, Disc3, Play, Search, Shuffle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SongResult } from '../../types';
import type { GridViewCollectionDescriptor } from '../../library/core/collection/collection.contract';
import type { CollectionResource } from '../../library/core/shared/resource.contract';
import type { LibraryPlaybackPort } from '../../library/core/shared/ports.contract';
import { useCollectionResourceState } from '../../library/core/collection/resource/useCollectionResourceState';
import { useCollectionView } from '../../library/core/collection/useCollectionView';
import { useCollectionActions } from '../../library/core/collection/mutations/useCollectionActions';
import { useCommittedQuery } from '../../library/core/shared/useCommittedQuery';
import { useLibrarySessionQuery } from '../../library/core/shared/useLibrarySessionQuery';
import { collectionKey } from '../../library/core/collection/collectionIdentity';
import { getSizedCoverUrl } from '../../utils/coverUrl';
import {
    COLLECTION_TRACK_ROW_HEIGHT,
    MinimalistCollectionRow,
    type CollectionTrackRowData,
} from './MinimalistCollectionRow';
import type { MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/MinimalistCollectionView.tsx
// Virtualized playlist, album, and folder track-list detail page for Minimalist Mode.

type MinimalistCollectionViewProps = {
    collection: GridViewCollectionDescriptor;
    resource: CollectionResource | null;
    playback: LibraryPlaybackPort;
    currentSong: SongResult | null;
    palette: MinimalistThemePalette;
    onBack: () => void;
};

const MinimalistCollectionView: React.FC<MinimalistCollectionViewProps> = ({
    collection,
    resource,
    playback,
    currentSong,
    palette,
    onBack,
}) => {
    const { t } = useTranslation();
    const sessionKey = collectionKey(collection);
    const { snapshot } = useCollectionResourceState(resource);
    const tracks = useMemo(() => snapshot?.tracks ?? [], [snapshot?.tracks]);
    const { query, setQuery } = useLibrarySessionQuery(sessionKey);
    const committedQuery = useCommittedQuery(query);

    const view = useCollectionView({ tracks, committedQuery });
    const actions = useCollectionActions({
        resource,
        snapshot,
        view,
        port: playback,
        collectionType: collection.type,
        collectionName: collection.name,
    });

    const rowProps = useMemo<CollectionTrackRowData>(() => ({
        tracks: view.displayTracks,
        currentSong,
        palette,
        onPlayTrack: actions.playTrack,
        onEnqueueTrack: actions.enqueueTrack,
        onSaveTrack: actions.saveTrackToPlaylist,
        canSaveTrack: actions.canSaveTrackToPlaylist,
    }), [actions.canSaveTrackToPlaylist, actions.enqueueTrack, actions.playTrack, actions.saveTrackToPlaylist, currentSong, palette, view.displayTracks]);

    const coverUrl = getSizedCoverUrl(collection.coverUrl, 256);
    const isLoading = snapshot?.status === 'loading' && view.displayTracks.length === 0;

    return (
        <div className="h-full flex flex-col min-h-0" style={{ backgroundColor: palette.pageBg }}>
            <header
                className="shrink-0 flex items-center gap-3 px-4 py-3 border-b"
                style={{
                    backgroundColor: palette.surfaceBg,
                    borderColor: palette.borderColor,
                    paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px), var(--window-buttons-drop, 0px))',
                }}
            >
                <button
                    type="button"
                    aria-label={t('ui.back')}
                    onClick={onBack}
                    className="p-2 rounded-full shrink-0"
                    style={{ backgroundColor: palette.mutedBg, color: palette.textPrimary }}
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ backgroundColor: palette.mutedBg }}>
                    {coverUrl ? (
                        <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <Disc3 size={18} style={{ color: palette.textSecondary }} />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold truncate" style={{ color: palette.textPrimary }}>
                        {collection.name}
                    </h2>
                    <div className="text-xs truncate" style={{ color: palette.textSecondary }}>
                        {view.displayTracks.length} {t('minimalist.collection.tracksUnit')}
                    </div>
                </div>
            </header>

            <div className="shrink-0 px-4 py-2.5 flex flex-wrap items-center gap-2 border-b" style={{ borderColor: palette.borderColor }}>
                <button
                    type="button"
                    disabled={view.contextTracks.length === 0}
                    onClick={actions.playScope}
                    className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium disabled:opacity-40"
                    style={{ backgroundColor: palette.accentColor, color: '#ffffff' }}
                >
                    <Play size={13} />
                    <span>{t('minimalist.collection.playAll')}</span>
                </button>
                <button
                    type="button"
                    disabled={view.contextTracks.length === 0}
                    onClick={actions.shuffleScope}
                    className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium disabled:opacity-40"
                    style={{ backgroundColor: palette.mutedBg, color: palette.textPrimary }}
                >
                    <Shuffle size={13} />
                    <span>{t('minimalist.player.shuffle')}</span>
                </button>
                <div
                    className="ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1 min-w-[140px]"
                    style={{ backgroundColor: palette.surfaceBg, borderColor: palette.borderColor }}
                >
                    <Search size={13} style={{ color: palette.textSecondary }} />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t('minimalist.collection.filterPlaceholder')}
                        className="w-28 bg-transparent text-xs outline-none"
                        style={{ color: palette.textPrimary }}
                    />
                </div>
            </div>

            <div className="min-h-0 flex-1">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center text-sm" style={{ color: palette.textSecondary }}>
                        {t('playlist.loading', 'Loading...')}
                    </div>
                ) : view.displayTracks.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm" style={{ color: palette.textSecondary }}>
                        {t('minimalist.collection.empty')}
                    </div>
                ) : (
                    <List
                        rowCount={view.displayTracks.length}
                        rowHeight={COLLECTION_TRACK_ROW_HEIGHT}
                        rowComponent={MinimalistCollectionRow}
                        rowProps={rowProps}
                        overscanCount={8}
                        style={{ height: '100%', width: '100%' }}
                    />
                )}
            </div>
        </div>
    );
};

export default MinimalistCollectionView;
