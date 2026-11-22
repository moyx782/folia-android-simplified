import React, { useCallback, useEffect } from 'react';
import { Disc3, Play, Radio, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SongResult } from '../../types';
import type { OmniExploreItem, OmniExploreSection } from '../../types/onlineMusic';
import type { HomeSurfaceProps } from '../app/home/homeSurfaceTypes';
import type { LibraryAccountController } from '../../library/core/account/account.contract';
import type { GridViewCollectionDescriptor } from '../../library/core/collection/collection.contract';
import type { LibraryHomeResources } from '../../library/core/home/homeModel.contract';
import { useLibraryHomeSources } from '../../library/core/home/useLibraryHomeSources';
import { createOnlineGridViewCollection } from '../app/home/gridViewCollectionAdapters';
import { listenedSongsOf, useOwnExploreSections } from '../app/home/explore/ownSections';
import { useExploreFeedStore } from '../../stores/useExploreFeedStore';
import { getSongArtistLabel, getSongCoverUrl } from '../../services/onlineMusic/songMetadata';
import { getSizedCoverUrl } from '../../utils/coverUrl';
import { openLoginWindow } from '../login/loginWindowStore';
import type { MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/MinimalistDiscoverTab.tsx
// Standard static "Discover" feed displaying Personal FM shortcut, recently played shelves, and provider recommendations.

type MinimalistDiscoverTabProps = {
    surfaceProps: HomeSurfaceProps;
    account: LibraryAccountController;
    homeResources: LibraryHomeResources;
    palette: MinimalistThemePalette;
    onOpenCollection: (collection: GridViewCollectionDescriptor) => void;
    onSwitchToLibrary: () => void;
};

const MinimalistDiscoverTab: React.FC<MinimalistDiscoverTabProps> = ({
    surfaceProps,
    account,
    homeResources,
    palette,
    onOpenCollection,
    onSwitchToLibrary,
}) => {
    const { t, i18n } = useTranslation();
    const { online } = useLibraryHomeSources({
        account,
        user: surfaceProps.user,
        playlists: surfaceProps.playlists,
        cloudPlaylist: surfaceProps.cloudPlaylist,
        navidromeEnabled: surfaceProps.navidromeEnabled,
    });
    const providerId = online.providerId;
    const accountId = String(online.user?.id ?? '');
    const key = `${providerId}:${accountId}:${i18n.language}`;
    const feed = useExploreFeedStore(state => (state.key === key ? state.feed : null));
    const keptKey = useExploreFeedStore(state => state.key);
    const show = useExploreFeedStore(state => state.show);
    const refresh = useExploreFeedStore(state => state.refresh);
    const loadMore = useExploreFeedStore(state => state.loadMore);

    const listened = useCallback(() => listenedSongsOf(providerId, accountId), [providerId, accountId]);

    useEffect(() => {
        if (!online.canUseExplore) return;
        show(key, listened());
    }, [keptKey, key, listened, online.canUseExplore, show]);

    const ownSections = useOwnExploreSections(providerId, accountId);
    const providedSections = (feed?.sections ?? []).filter(section => section.items.length > 0);
    const sections = online.canUseExplore ? [...ownSections, ...providedSections] : ownSections;

    const handleSelectItem = (item: OmniExploreItem, section: OmniExploreSection) => {
        if (item.kind === 'song') {
            const queue: SongResult[] = section.items
                .filter((entry): entry is Extract<OmniExploreItem, { kind: 'song' }> => entry.kind === 'song')
                .map(entry => entry.song);
            surfaceProps.onPlaySong(item.song, queue.length > 0 ? queue : [item.song], false);
            return;
        }
        onOpenCollection(createOnlineGridViewCollection(item.collection, providerId));
    };

    const isGuest = online.accountView === 'guest';

    return (
        <div className="h-full overflow-y-auto px-4 py-4 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
                {online.canUseRadio && (
                    <button
                        type="button"
                        onClick={() => { void homeResources.actions.playPersonalFm(); }}
                        className="flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium"
                        style={{ backgroundColor: palette.surfaceBg, borderColor: palette.borderColor, color: palette.textPrimary }}
                    >
                        <Radio size={16} style={{ color: palette.accentColor }} />
                        <span>{t('minimalist.discover.personalFm')}</span>
                    </button>
                )}
                {isGuest && (
                    <button
                        type="button"
                        onClick={() => openLoginWindow(providerId)}
                        className="rounded-xl px-3.5 py-2.5 text-sm font-medium"
                        style={{ backgroundColor: palette.accentColor, color: '#ffffff' }}
                    >
                        {t('minimalist.discover.signIn', { provider: online.providerLabel })}
                    </button>
                )}
                {online.canUseExplore && (
                    <button
                        type="button"
                        onClick={() => refresh(listened())}
                        className="ml-auto flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium"
                        style={{ backgroundColor: palette.mutedBg, color: palette.textSecondary }}
                    >
                        <RefreshCw size={13} />
                        <span>{t('home.exploreRefresh', 'Refresh')}</span>
                    </button>
                )}
            </div>

            {sections.length === 0 ? (
                <div
                    className="rounded-2xl border p-6 text-center space-y-3"
                    style={{ backgroundColor: palette.surfaceBg, borderColor: palette.borderColor }}
                >
                    <div className="text-sm font-medium" style={{ color: palette.textPrimary }}>
                        {feed?.status === 'loading' ? t('home.loadingLibrary') : t('minimalist.discover.empty')}
                    </div>
                    <button
                        type="button"
                        onClick={onSwitchToLibrary}
                        className="rounded-lg px-4 py-2 text-xs font-medium"
                        style={{ backgroundColor: palette.mutedBg, color: palette.accentColor }}
                    >
                        {t('minimalist.discover.openLibrary')}
                    </button>
                </div>
            ) : sections.map(section => (
                <section key={section.id} className="space-y-2.5">
                    {section.title && (
                        <h2 className="text-sm font-semibold" style={{ color: palette.textPrimary }}>
                            {section.title}
                        </h2>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {section.items.map((item, idx) => {
                            const isSong = item.kind === 'song';
                            const rawCover = item.wideCoverUrl || (isSong ? getSongCoverUrl(item.song) : item.collection.coverUrl);
                            const coverUrl = getSizedCoverUrl(rawCover, 256);
                            const title = isSong ? item.song.name : item.collection.name;
                            const subtitle = item.subtitle ?? (isSong ? getSongArtistLabel(item.song) : '');
                            return (
                                <button
                                    key={`${section.id}-${idx}`}
                                    type="button"
                                    onClick={() => handleSelectItem(item, section)}
                                    className="text-left rounded-xl border overflow-hidden"
                                    style={{ backgroundColor: palette.surfaceBg, borderColor: palette.borderColor }}
                                >
                                    <div
                                        className="aspect-square w-full flex items-center justify-center overflow-hidden relative"
                                        style={{ backgroundColor: palette.mutedBg }}
                                    >
                                        {coverUrl ? (
                                            <img src={coverUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                                        ) : (
                                            <Disc3 size={28} style={{ color: palette.textSecondary }} />
                                        )}
                                        {isSong && (
                                            <span
                                                className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                                                style={{ backgroundColor: palette.surfaceBg, color: palette.accentColor }}
                                            >
                                                <Play size={13} />
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-2.5">
                                        <div className="text-xs font-medium truncate" style={{ color: palette.textPrimary }}>
                                            {title}
                                        </div>
                                        {subtitle && (
                                            <div className="text-[11px] truncate mt-0.5" style={{ color: palette.textSecondary }}>
                                                {subtitle}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>
            ))}

            {online.canUseExplore && Boolean(feed?.nextCursor) && (
                <div className="flex justify-center pt-2">
                    <button
                        type="button"
                        disabled={Boolean(feed?.loadingMore)}
                        onClick={() => { void loadMore(); }}
                        className="rounded-xl px-4 py-2 text-xs font-medium disabled:opacity-50"
                        style={{ backgroundColor: palette.surfaceBg, color: palette.textPrimary, border: `1px solid ${palette.borderColor}` }}
                    >
                        {t('home.exploreMore', 'Load More')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default MinimalistDiscoverTab;
