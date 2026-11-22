import React, { useEffect, useMemo } from 'react';
import { FolderPlus, RefreshCw, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LocalLibraryGroup } from '../../types';
import type { HomeSurfaceProps } from '../app/home/homeSurfaceTypes';
import type { LibraryAccountController } from '../../library/core/account/account.contract';
import type { GridViewCollectionDescriptor } from '../../library/core/collection/collection.contract';
import type { LibraryHomeResources } from '../../library/core/home/homeModel.contract';
import { isOnlineHomeTab, resolveHomeSourceGroups, type LibraryHomeSourceGroup } from '../../library/core/home/homeSources';
import { useLibraryHomeSources } from '../../library/core/home/useLibraryHomeSources';
import { useLibraryHomeOnline } from '../../library/core/home/online/useLibraryHomeOnline';
import { useLibraryHomeLocal, useLocalDirectoryTrees } from '../../library/core/home/useLibraryHomeLocal';
import { useLibraryHomeActions } from '../../library/core/home/useLibraryHomeActions';
import { useLibraryHomeNavidrome } from '../../library/core/home/navidrome/useLibraryHomeNavidrome';
import { resolveNavidromeCollectionType } from '../../library/core/home/navidrome/navidromeHomeModel';
import { openSettings } from '../../stores/useSettingsModalStore';
import { openLoginWindow } from '../login/loginWindowStore';
import MinimalistCardList from './MinimalistCardList';
import type { MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/MinimalistLibraryTab.tsx
// Standard static Library tab supporting Online playlists/albums/radio, Local folders/playlists/albums/artists, and Navidrome.

type MinimalistLibraryTabProps = {
    surfaceProps: HomeSurfaceProps;
    account: LibraryAccountController;
    homeResources: LibraryHomeResources;
    palette: MinimalistThemePalette;
    onOpenCollection: (collection: GridViewCollectionDescriptor) => void;
};

const MinimalistLibraryTab: React.FC<MinimalistLibraryTabProps> = ({
    surfaceProps,
    account,
    homeResources,
    palette,
    onOpenCollection,
}) => {
    const { t } = useTranslation();
    const sources = useLibraryHomeSources({
        account,
        user: surfaceProps.user,
        playlists: surfaceProps.playlists,
        cloudPlaylist: surfaceProps.cloudPlaylist,
        navidromeEnabled: surfaceProps.navidromeEnabled,
    });
    const { tab, setTab, online, tabs } = sources;
    const onlineList = useLibraryHomeOnline(homeResources, sources);
    const local = useLibraryHomeLocal({
        localSongs: surfaceProps.localSongs,
        localPlaylists: surfaceProps.localPlaylists,
        catalog: surfaceProps.localLibraryCatalog,
        activeRow: surfaceProps.localMusicState.activeRow,
    });
    useLocalDirectoryTrees(homeResources.localDirectoryTrees, surfaceProps.localSongs);
    const { snapshot: actionState, importBusy } = useLibraryHomeActions(homeResources.actions);
    const navidrome = useLibraryHomeNavidrome(homeResources.navidromeOverview);

    const groups = resolveHomeSourceGroups(tabs);
    const activeSource: LibraryHomeSourceGroup['source'] = isOnlineHomeTab(tab) ? 'online' : tab === 'local' ? 'local' : 'navidrome';
    const onlineTabs = useMemo(
        () => (groups.find(group => group.source === 'online')?.tabs ?? []).filter(entry => entry.key !== 'explore'),
        [groups],
    );

    useEffect(() => {
        if (tab !== 'explore') return;
        const nextTab = onlineTabs.find(entry => !entry.disabledReason)
            ?? tabs.find(candidate => candidate.key !== 'explore' && !candidate.disabledReason);
        if (nextTab) setTab(nextTab.key);
    }, [onlineTabs, setTab, tab, tabs]);

    const selectSource = (group: LibraryHomeSourceGroup) => {
        if (group.disabledReason) return;
        const candidates = group.tabs.filter(entry => entry.key !== 'explore');
        const next = candidates.find(candidate => candidate.key === tab && !candidate.disabledReason)
            ?? candidates.find(candidate => !candidate.disabledReason);
        if (next) setTab(next.key);
    };

    const pillStyle = (active: boolean) => ({
        backgroundColor: active ? palette.surfaceBg : 'transparent',
        color: active ? palette.accentColor : palette.textSecondary,
        border: active ? `1px solid ${palette.borderColor}` : '1px solid transparent',
    });

    return (
        <div className="h-full flex flex-col min-h-0">
            <div className="shrink-0 px-4 pt-3 pb-2 space-y-2 border-b" style={{ borderColor: palette.borderColor }}>
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                    {groups.map(group => {
                        const active = group.source === activeSource;
                        const label = group.source === 'online' ? online.providerLabel : group.tabs[0]?.label ?? group.source;
                        return (
                            <button
                                key={group.source}
                                type="button"
                                disabled={Boolean(group.disabledReason)}
                                onClick={() => selectSource(group)}
                                className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium disabled:opacity-40"
                                style={{ backgroundColor: active ? palette.accentColor : palette.mutedBg, color: active ? '#ffffff' : palette.textPrimary }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
                {activeSource === 'online' && (
                    <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
                        {onlineTabs.map(entry => (
                            <button key={entry.key} type="button" disabled={Boolean(entry.disabledReason)} onClick={() => setTab(entry.key)} className="shrink-0 rounded-lg px-2.5 py-1 text-xs disabled:opacity-40" style={pillStyle(entry.key === tab)}>
                                {entry.label}
                            </button>
                        ))}
                    </div>
                )}
                {activeSource === 'local' && (
                    <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
                        {local.sections.map(section => (
                            <button key={section.key} type="button" onClick={() => surfaceProps.setLocalMusicState(prev => ({ ...prev, activeRow: section.row }))} className="shrink-0 rounded-lg px-2.5 py-1 text-xs" style={pillStyle(section.key === local.activeSection.key)}>
                                {section.label}
                            </button>
                        ))}
                    </div>
                )}
                {activeSource === 'navidrome' && navidrome.config && (
                    <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
                        {navidrome.sections.map(section => (
                            <button key={section.key} type="button" onClick={() => navidrome.setSection(section.key)} className="shrink-0 rounded-lg px-2.5 py-1 text-xs" style={pillStyle(section.active)}>
                                {section.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {activeSource === 'online' && (online.accountView === 'guest' ? (
                    <div className="py-12 text-center space-y-3">
                        <div className="text-sm" style={{ color: palette.textSecondary }}>{t('home.guestTitle', 'Not signed in')}</div>
                        <button type="button" onClick={() => openLoginWindow(online.providerId)} className="rounded-xl px-4 py-2 text-xs font-medium" style={{ backgroundColor: palette.accentColor, color: '#ffffff' }}>
                            {t('minimalist.discover.signIn', { provider: online.providerLabel })}
                        </button>
                    </div>
                ) : (
                    <MinimalistCardList
                        items={onlineList.items}
                        palette={palette}
                        emptyText={onlineList.isLoading ? t('home.loadingLibrary') : onlineList.emptyMessage}
                        onOpen={card => { void homeResources.actions.openOnlineCard(card, online.providerId, onOpenCollection); }}
                    />
                ))}

                {activeSource === 'local' && (
                    <>
                        <div className="flex flex-wrap gap-2">
                            {actionState.deviceScanAvailable && (
                                <button type="button" disabled={importBusy} onClick={() => { void homeResources.actions.scanDeviceMusic(); }} className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium disabled:opacity-40" style={{ backgroundColor: palette.mutedBg, color: palette.textPrimary }}>
                                    <Smartphone size={14} /><span>{t('localMusic.scanDeviceMusic', 'Scan Device Music')}</span>
                                </button>
                            )}
                            <button type="button" disabled={importBusy} onClick={() => { void homeResources.actions.importFolder(); }} className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium disabled:opacity-40" style={{ backgroundColor: palette.mutedBg, color: palette.textPrimary }}>
                                <FolderPlus size={14} /><span>{t('localMusic.importFolder', 'Import Folder')}</span>
                            </button>
                            <button type="button" disabled={importBusy} onClick={() => { void homeResources.actions.refreshFolders(); }} className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium disabled:opacity-40" style={{ backgroundColor: palette.mutedBg, color: palette.textPrimary }}>
                                <RefreshCw size={14} /><span>{t('home.exploreRefresh', 'Refresh')}</span>
                            </button>
                        </div>
                        <MinimalistCardList
                            items={local.activeSection.cards}
                            palette={palette}
                            emptyText={local.activeSection.emptyMessage}
                            onOpen={card => homeResources.actions.openLocalGroup(card.raw as LocalLibraryGroup, onOpenCollection)}
                        />
                    </>
                )}

                {activeSource === 'navidrome' && (!navidrome.config ? (
                    <div className="py-12 text-center space-y-3">
                        <div className="text-sm" style={{ color: palette.textSecondary }}>{t('navidrome.notConfigured', 'Navidrome is not configured.')}</div>
                        <button type="button" onClick={() => openSettings('options', 'integration')} className="rounded-xl px-4 py-2 text-xs font-medium" style={{ backgroundColor: palette.mutedBg, color: palette.accentColor }}>
                            {t('navidrome.settings', 'Navidrome Settings')}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-end">
                            <button type="button" onClick={() => { void navidrome.refresh(); }} className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: palette.mutedBg, color: palette.textPrimary }}>
                                <RefreshCw size={14} /><span>{t('home.exploreRefresh', 'Refresh')}</span>
                            </button>
                        </div>
                        <MinimalistCardList
                            items={navidrome.items}
                            palette={palette}
                            emptyText={navidrome.isLoading ? t('home.loadingLibrary') : navidrome.emptyMessage}
                            onOpen={card => homeResources.actions.openNavidromeCard(card, resolveNavidromeCollectionType(navidrome.section, card.id), onOpenCollection)}
                        />
                    </>
                ))}
            </div>
        </div>
    );
};

export default MinimalistLibraryTab;
