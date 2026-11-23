import React, { useEffect, useMemo } from 'react';
import { List } from 'react-window';
import { ChevronRight, Search, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import type { UnifiedSong } from '../../types';
import type { MediaId, OmniCollection } from '../../types/onlineMusic';
import { getSearchKinds, type SearchKind, type SearchSource, useSearchNavigationStore } from '../../stores/useSearchNavigationStore';
import { useSearchSources } from '../app/search/searchSources';
import { useSearchSourceLabel } from '../app/search/SearchTabs';
import { getSizedCoverUrl } from '../../utils/coverUrl';
import { MinimalistSearchSongRow, SEARCH_SONG_ROW_HEIGHT, type SearchSongRowData } from './MinimalistSearchSongRow';
import type { MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/MinimalistSearchTab.tsx
// Virtualized standard Search tab for Minimalist Mode supporting source switching, search kinds, and history chips.

type MinimalistSearchTabProps = {
    hasLocalSongs: boolean;
    palette: MinimalistThemePalette;
    onSubmitSearch: (source?: SearchSource, kind?: SearchKind) => void;
    onLoadMore: () => void;
    onPlayTrack: (track: UnifiedSong) => void;
    onAddTrackToQueue: (track: UnifiedSong) => void;
    onOpenArtist: (track: UnifiedSong, artistName: string, artistId?: MediaId, entityId?: string) => void;
    onOpenAlbum: (track: UnifiedSong, albumName: string, albumId?: MediaId, entityId?: string) => void;
    onOpenCollection: (collection: OmniCollection) => void;
    resolveTrackDisplay?: (track: UnifiedSong) => UnifiedSong;
};

const KIND_KEYS: Record<SearchKind, string> = { song: 'search.kindSong', album: 'search.kindAlbum', playlist: 'search.kindPlaylist' };

const MinimalistSearchTab: React.FC<MinimalistSearchTabProps> = ({
    hasLocalSongs,
    palette,
    onSubmitSearch,
    onLoadMore,
    onPlayTrack,
    onAddTrackToQueue,
    onOpenArtist,
    onOpenAlbum,
    onOpenCollection,
    resolveTrackDisplay,
}) => {
    const { t } = useTranslation();
    const { sources, activeProviderId } = useSearchSources(hasLocalSongs);
    const getSourceLabel = useSearchSourceLabel();
    const {
        searchQuery, submittedQuery, searchSourceTab, searchKind, searchResults, collectionResults,
        isSearching, isLoadingMore, searchError, hasMore, searchHistory,
        setSearchQuery, setSearchTarget, forgetSearchHistoryQuery, clearSearchHistory,
    } = useSearchNavigationStore(useShallow(state => ({
        searchQuery: state.searchQuery, submittedQuery: state.submittedQuery, searchSourceTab: state.searchSourceTab,
        searchKind: state.searchKind, searchResults: state.searchResults, collectionResults: state.collectionResults,
        isSearching: state.isSearching, isLoadingMore: state.isLoadingMore, searchError: state.searchError,
        hasMore: state.hasMore, searchHistory: state.searchHistory, setSearchQuery: state.setSearchQuery,
        setSearchTarget: state.setSearchTarget, forgetSearchHistoryQuery: state.forgetSearchHistoryQuery,
        clearSearchHistory: state.clearSearchHistory,
    })));

    useEffect(() => {
        const fellBack = useSearchNavigationStore.getState().keepSearchSourceWithin(sources, activeProviderId);
        if (fellBack && submittedQuery.trim()) onSubmitSearch(activeProviderId);
    }, [activeProviderId, onSubmitSearch, sources, submittedQuery]);

    const activeSource = sources.includes(searchSourceTab) ? searchSourceTab : sources[0];
    const kinds = activeSource ? getSearchKinds(activeSource) : ['song' as SearchKind];
    const hasQuery = searchQuery.trim().length > 0;
    const displaySongs = useMemo(
        () => (searchResults ?? []).map(track => (resolveTrackDisplay ? resolveTrackDisplay(track) : track)),
        [resolveTrackDisplay, searchResults],
    );
    const rowProps = useMemo<SearchSongRowData>(
        () => ({ songs: displaySongs, palette, onPlayTrack, onAddTrackToQueue, onOpenArtist, onOpenAlbum }),
        [displaySongs, onAddTrackToQueue, onOpenAlbum, onOpenArtist, onPlayTrack, palette],
    );

    const handleSelectTarget = (source: SearchSource, kind: SearchKind) => {
        if (hasQuery) {
            onSubmitSearch(source, kind);
        } else {
            setSearchTarget(source, kind);
        }
    };

    return (
        <div className="h-full flex flex-col min-h-0">
            <form
                onSubmit={(event) => { event.preventDefault(); onSubmitSearch(activeSource, searchKind); }}
                className="shrink-0 px-4 pt-3 pb-2 space-y-2 border-b"
                style={{ borderColor: palette.borderColor }}
            >
                <div className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ backgroundColor: palette.surfaceBg, borderColor: palette.borderColor }}>
                    <Search size={16} style={{ color: palette.textSecondary }} />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder={t('search.placeholder', 'Search songs, albums, playlists')}
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--minimalist-placeholder,rgba(161,161,170,0.72))] placeholder:opacity-75"
                        style={{ color: palette.textPrimary }}
                    />
                    {searchQuery && (
                        <button type="button" aria-label={t('options.settingsSearchClear')} onClick={() => setSearchQuery('')} style={{ color: palette.textSecondary }}><X size={15} /></button>
                    )}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                    {sources.map(source => {
                        const active = source === activeSource;
                        return (
                            <button
                                key={source}
                                type="button"
                                onClick={() => handleSelectTarget(source, searchKind)}
                                className="shrink-0 rounded-full px-3 py-1 text-xs font-medium"
                                style={{ backgroundColor: active ? palette.accentColor : palette.mutedBg, color: active ? palette.onAccentColor : palette.textPrimary }}
                            >
                                {getSourceLabel(source)}
                            </button>
                        );
                    })}
                </div>
                {kinds.length > 1 && (
                    <div className="flex items-center gap-1.5">
                        {kinds.map(kind => (
                            <button
                                key={kind}
                                type="button"
                                onClick={() => handleSelectTarget(activeSource, kind)}
                                className="rounded-lg px-2.5 py-1 text-xs"
                                style={{
                                    backgroundColor: kind === searchKind ? palette.surfaceBg : 'transparent',
                                    color: kind === searchKind ? palette.accentColor : palette.textSecondary,
                                    border: kind === searchKind ? `1px solid ${palette.borderColor}` : '1px solid transparent',
                                }}
                            >
                                {t(KIND_KEYS[kind])}
                            </button>
                        ))}
                    </div>
                )}
            </form>

            <div className="min-h-0 flex-1 flex flex-col">
                {searchError && !isSearching && (
                    <div className="px-4 py-6 text-center space-y-2">
                        <div className="text-xs text-red-500">{searchError}</div>
                        <button type="button" onClick={() => onSubmitSearch(activeSource, searchKind)} className="rounded-lg px-3 py-1 text-xs font-medium" style={{ backgroundColor: palette.mutedBg, color: palette.textPrimary }}>
                            {t('search.retry')}
                        </button>
                    </div>
                )}
                {isSearching && <div className="px-4 py-6 text-center text-sm" style={{ color: palette.textSecondary }}>{t('playlist.loading', 'Loading...')}</div>}
                {hasQuery && !isSearching && !searchError && searchKind === 'song' && searchResults !== null && (
                    displaySongs.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm" style={{ color: palette.textSecondary }}>{t('minimalist.search.noResults')}</div>
                    ) : (
                        <div className="min-h-0 flex-1 flex flex-col">
                            <div className="min-h-0 flex-1">
                                <List rowCount={displaySongs.length} rowHeight={SEARCH_SONG_ROW_HEIGHT} rowComponent={MinimalistSearchSongRow} rowProps={rowProps} overscanCount={8} style={{ height: '100%', width: '100%' }} />
                            </div>
                            {hasMore && (
                                <div className="shrink-0 p-3 text-center border-t" style={{ borderColor: palette.borderColor }}>
                                    <button type="button" disabled={isLoadingMore} onClick={onLoadMore} className="rounded-xl px-4 py-1.5 text-xs font-medium disabled:opacity-40" style={{ backgroundColor: palette.mutedBg, color: palette.textPrimary }}>
                                        {t('home.exploreMore', 'Load More')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                )}
                {hasQuery && !isSearching && !searchError && searchKind !== 'song' && collectionResults !== null && (
                    collectionResults.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm" style={{ color: palette.textSecondary }}>{t('minimalist.search.noResults')}</div>
                    ) : (
                        <div className="overflow-y-auto px-4 py-3 space-y-2">
                            {collectionResults.map((col, idx) => (
                                <button key={`${col.id}-${idx}`} type="button" onClick={() => onOpenCollection(col)} className="w-full flex items-center gap-3 rounded-xl border p-2.5 text-left" style={{ backgroundColor: palette.surfaceBg, borderColor: palette.borderColor }}>
                                    <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0" style={{ backgroundColor: palette.mutedBg }}>
                                        {col.coverUrl && <img src={getSizedCoverUrl(col.coverUrl, 256)} alt="" loading="lazy" className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium truncate" style={{ color: palette.textPrimary }}>{col.name}</div>
                                        <div className="text-xs truncate" style={{ color: palette.textSecondary }}>{col.trackCount !== undefined ? `${col.trackCount}` : ''}</div>
                                    </div>
                                    <ChevronRight size={16} style={{ color: palette.textSecondary }} />
                                </button>
                            ))}
                        </div>
                    )
                )}
                {!hasQuery && !isSearching && searchHistory.length > 0 && (
                    <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium" style={{ color: palette.textSecondary }}>{t('minimalist.search.recent')}</span>
                            <button type="button" onClick={clearSearchHistory} className="flex items-center gap-1 text-xs" style={{ color: palette.textSecondary }}>
                                <Trash2 size={12} /><span>{t('minimalist.search.clearHistory')}</span>
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {searchHistory.map(term => (
                                <div key={term} className="flex items-center rounded-full border text-xs" style={{ backgroundColor: palette.surfaceBg, borderColor: palette.borderColor }}>
                                    <button type="button" onClick={() => { setSearchQuery(term); onSubmitSearch(activeSource, searchKind); }} className="px-3 py-1" style={{ color: palette.textPrimary }}>{term}</button>
                                    <button type="button" aria-label={t('minimalist.search.removeHistoryItem')} onClick={() => forgetSearchHistoryQuery(term)} className="pr-2.5 pl-0.5 py-1" style={{ color: palette.textSecondary }}><X size={12} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MinimalistSearchTab;
