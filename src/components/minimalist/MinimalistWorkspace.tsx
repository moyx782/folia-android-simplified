import React, { useEffect, useMemo, useState } from 'react';
import { useLibraryDirectoryBatchController } from '../../library/app/useLibraryDirectoryBatchController';
import { useLibraryHomeResources } from '../../library/app/useLibraryHomeResources';
import LibraryAccountHost from '../../library/app/LibraryAccountHost';
import { useSearchNavigationStore } from '../../stores/useSearchNavigationStore';
import { createMinimalistPalette, type MinimalistTab, type MinimalistWorkspaceProps } from './minimalistTypes';
import MinimalistTopBar from './MinimalistTopBar';
import MinimalistBottomNav from './MinimalistBottomNav';
import MinimalistMiniPlayer from './MinimalistMiniPlayer';
import MinimalistQueueSheet from './MinimalistQueueSheet';
import MinimalistNowPlaying from './MinimalistNowPlaying';
import MinimalistCollectionHost from './MinimalistCollectionHost';
import MinimalistDiscoverTab from './MinimalistDiscoverTab';
import MinimalistLibraryTab from './MinimalistLibraryTab';
import MinimalistSearchTab from './MinimalistSearchTab';
import MinimalistProfileTab from './MinimalistProfileTab';

// src/components/minimalist/MinimalistWorkspace.tsx
// Root lazy-loaded Minimalist Mode ("极简模式") workspace providing standard music software views without animations or blur.

const MinimalistWorkspace: React.FC<MinimalistWorkspaceProps> = ({
    homeModel,
    currentView,
    navigateBackFromPlayer,
    navigateToPlayer,
    theme,
    isDaylight,
    toggleDaylightMode,
    currentSong,
    playQueue,
    playerState,
    duration,
    effectiveLoopMode,
    lyrics,
    currentLineIndex,
    isLiked,
    canTogglePlayback,
    isControlDisabled,
    togglePlay,
    toggleLoop,
    onPrevTrack,
    onNextTrack,
    shuffleQueue,
    onLike,
    onSeek,
    onSeekLyricLine,
    playingSongLinks,
    playSong,
    removeQueueSong,
    moveQueueSongToNext,
    openLyricMatch,
    openCommandPalette,
    onSubmitSearch,
    onLoadMoreSearch,
    onPlaySearchResult,
    onAddSearchResultToQueue,
    onOpenSearchArtist,
    onOpenSearchAlbum,
    onOpenSearchCollection,
    resolveSearchResultDisplay,
    hasLocalSongs,
}) => {
    const [activeTab, setActiveTab] = useState<MinimalistTab>('discover');
    const [isQueueOpen, setIsQueueOpen] = useState(false);
    const isSearchOpen = useSearchNavigationStore(state => state.isSearchOpen);

    useEffect(() => {
        if (isSearchOpen) setActiveTab('search');
    }, [isSearchOpen]);

    const handleSelectTab = (tab: MinimalistTab) => {
        if (tab !== 'search' && useSearchNavigationStore.getState().isSearchOpen) {
            useSearchNavigationStore.getState().hideSearchOverlay();
        }
        setActiveTab(tab);
    };

    useLibraryDirectoryBatchController(homeModel.surfaceProps);
    const homeResources = useLibraryHomeResources(homeModel.surfaceProps, { active: true });
    const palette = useMemo(() => createMinimalistPalette(isDaylight, theme), [isDaylight, theme]);
    const rootStyle: React.CSSProperties & { '--minimalist-placeholder': string } = {
        backgroundColor: palette.pageBg,
        color: palette.textPrimary,
        '--minimalist-placeholder': palette.textSecondary,
    };

    return (
        <div
            data-testid="minimalist-workspace"
            className="fixed inset-0 z-10 flex flex-col"
            style={rootStyle}
        >
            <MinimalistTopBar
                activeTab={activeTab}
                palette={palette}
                onOpenCommandPalette={openCommandPalette}
                onToggleDaylight={toggleDaylightMode}
            />

            <main className="min-h-0 flex-1 overflow-hidden">
                {activeTab === 'discover' && (
                    <MinimalistDiscoverTab
                        surfaceProps={homeModel.surfaceProps}
                        account={homeModel.account}
                        homeResources={homeResources}
                        palette={palette}
                        onOpenCollection={homeModel.onOpenCollection}
                        onSwitchToLibrary={() => setActiveTab('library')}
                    />
                )}
                {activeTab === 'library' && (
                    <MinimalistLibraryTab
                        surfaceProps={homeModel.surfaceProps}
                        account={homeModel.account}
                        homeResources={homeResources}
                        palette={palette}
                        onOpenCollection={homeModel.onOpenCollection}
                    />
                )}
                {activeTab === 'search' && (
                    <MinimalistSearchTab
                        hasLocalSongs={hasLocalSongs}
                        palette={palette}
                        onSubmitSearch={onSubmitSearch}
                        onLoadMore={onLoadMoreSearch}
                        onPlayTrack={onPlaySearchResult}
                        onAddTrackToQueue={onAddSearchResultToQueue}
                        onOpenArtist={onOpenSearchArtist}
                        onOpenAlbum={onOpenSearchAlbum}
                        onOpenCollection={onOpenSearchCollection}
                        resolveTrackDisplay={resolveSearchResultDisplay}
                    />
                )}
                {activeTab === 'profile' && (
                    <MinimalistProfileTab
                        account={homeModel.account}
                        navidromeEnabled={Boolean(homeModel.surfaceProps.navidromeEnabled)}
                        palette={palette}
                    />
                )}
            </main>

            <MinimalistMiniPlayer
                currentSong={currentSong}
                playerState={playerState}
                duration={duration}
                canTogglePlayback={canTogglePlayback}
                isControlDisabled={isControlDisabled}
                palette={palette}
                onOpenNowPlaying={navigateToPlayer}
                onTogglePlay={togglePlay}
                onNextTrack={onNextTrack}
                onOpenQueue={() => setIsQueueOpen(true)}
            />

            <MinimalistBottomNav
                activeTab={activeTab}
                palette={palette}
                onSelectTab={handleSelectTab}
            />

            <MinimalistCollectionHost
                surfaceProps={homeModel.surfaceProps}
                currentSong={currentSong}
                isPlayerOpen={currentView === 'player'}
                palette={palette}
                onPushCollection={homeModel.onPushCollection}
                onBackCollection={homeModel.onBackCollection}
            />

            <MinimalistNowPlaying
                isOpen={currentView === 'player'}
                currentSong={currentSong}
                playerState={playerState}
                duration={duration}
                effectiveLoopMode={effectiveLoopMode}
                lyrics={lyrics}
                currentLineIndex={currentLineIndex}
                isLiked={isLiked}
                canTogglePlayback={canTogglePlayback}
                isControlDisabled={isControlDisabled}
                palette={palette}
                onClose={navigateBackFromPlayer}
                onTogglePlay={togglePlay}
                onPrevTrack={onPrevTrack}
                onNextTrack={onNextTrack}
                onToggleLoop={toggleLoop}
                onShuffleQueue={shuffleQueue}
                onToggleLike={onLike}
                onSeek={onSeek}
                onSeekLyricLine={onSeekLyricLine}
                playingSongLinks={playingSongLinks}
                onOpenQueue={() => setIsQueueOpen(true)}
                onOpenLyricMatch={openLyricMatch}
            />

            <MinimalistQueueSheet
                isOpen={isQueueOpen}
                queue={playQueue}
                currentSong={currentSong}
                palette={palette}
                onClose={() => setIsQueueOpen(false)}
                onPlaySong={song => playSong(song, playQueue)}
                onShuffleQueue={shuffleQueue}
                onRemoveSong={removeQueueSong}
                onMoveNext={moveQueueSongToNext}
            />

            <LibraryAccountHost account={homeModel.account} theme={theme} isInteractive />
        </div>
    );
};

export default React.memo(MinimalistWorkspace);
