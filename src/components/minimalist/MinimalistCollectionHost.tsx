import React, { useCallback, useEffect, useMemo } from 'react';
import type { SongResult, UnifiedSong } from '../../types';
import { hasBlockingWindow, hasOpenSheet } from '../../utils/keyboardTargets';
import type { HomeSurfaceProps } from '../app/home/homeSurfaceTypes';
import {
    getActiveGridViewCollection,
    useCollectionNavigationStore,
} from '../../stores/useCollectionNavigationStore';
import {
    isLocalGridViewCollection,
    resolveLocalAlbumArtistDisplay,
    resolveLocalGridViewTracks,
    type GridViewCollectionDescriptor,
} from '../app/home/gridViewCollectionAdapters';
import { collectionKey } from '../../library/core/collection/collectionIdentity';
import { useCollectionResource } from '../../library/core/collection/resource/useCollectionResource';
import { useArtistResource } from '../../library/core/artist/useArtistResource';
import { createLibraryPlaybackPort } from '../../library/app/createLibraryPlaybackPort';
import { buildLocalCatalogIndex, resolveLocalCatalogLink } from '../../library/core/shared/localCatalogLinks';
import type { LibraryCatalogLinkHint } from '../../library/core/suite/suite.contract';
import MinimalistCollectionView from './MinimalistCollectionView';
import MinimalistArtistView from './MinimalistArtistView';
import type { MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/MinimalistCollectionHost.tsx
// Resolves stacked collection/artist descriptors into static Minimalist detail pages above the active tab.

type MinimalistCollectionHostProps = {
    surfaceProps: HomeSurfaceProps;
    currentSong: SongResult | null;
    isPlayerOpen: boolean;
    palette: MinimalistThemePalette;
    onPushCollection: (collection: GridViewCollectionDescriptor) => void;
    onBackCollection: () => void;
};

const MinimalistCollectionHost: React.FC<MinimalistCollectionHostProps> = ({
    surfaceProps,
    currentSong,
    isPlayerOpen,
    palette,
    onPushCollection,
    onBackCollection,
}) => {
    const collectionSnapshot = useCollectionNavigationStore(state => state.snapshot);
    const selectedCollection = getActiveGridViewCollection(collectionSnapshot);
    const localLibraryCatalog = surfaceProps.localLibraryCatalog;
    const selectedKey = collectionKey(selectedCollection);
    const isArtist = selectedCollection?.type === 'artist';

    const localTracks = useMemo(() => (
        selectedCollection && isLocalGridViewCollection(selectedCollection)
            ? resolveLocalGridViewTracks(selectedCollection, surfaceProps.localSongs, localLibraryCatalog) as UnifiedSong[]
            : undefined
    ), [localLibraryCatalog, selectedCollection, surfaceProps.localSongs]);

    const collectionResource = useCollectionResource({
        descriptor: selectedCollection && !isArtist ? selectedCollection : null,
        currentUserId: surfaceProps.user?.id,
        localTracks,
    });

    const artistLocalLibrary = useMemo(() => ({
        catalog: localLibraryCatalog,
        songs: surfaceProps.localSongs,
    }), [localLibraryCatalog, surfaceProps.localSongs]);

    const artistResource = useArtistResource({
        key: isArtist ? selectedKey : null,
        descriptor: isArtist ? selectedCollection : null,
        local: artistLocalLibrary,
    });

    const playbackPort = useMemo(() => createLibraryPlaybackPort(
        selectedCollection && selectedCollection.type !== 'artist'
            ? {
                ...surfaceProps,
                onPlaySong: (track, queue) => surfaceProps.onPlaySong(track, queue, false, selectedCollection),
                onPlayAll: surfaceProps.onPlayAll && ((songs, _from, options) => surfaceProps.onPlayAll?.(songs, selectedCollection, options)),
            }
            : surfaceProps,
    ), [selectedCollection, surfaceProps]);

    const handleOpenAlbum = useCallback((albumId: number | string, album?: LibraryCatalogLinkHint) => {
        if (!selectedCollection) return;
        const albumName = album?.name || '';
        const albumCoverUrl = album?.coverUrl;
        if (selectedCollection.source === 'online') {
            onPushCollection({
                ...(album && typeof album === 'object' ? album : {}),
                source: 'online',
                providerId: selectedCollection.providerId,
                id: albumId,
                name: albumName,
                type: 'album',
                coverUrl: albumCoverUrl,
            });
            return;
        }
        if (selectedCollection.source === 'navidrome') {
            onPushCollection({
                source: 'navidrome',
                id: String(albumId),
                name: albumName,
                type: 'album',
                coverUrl: albumCoverUrl,
            });
            return;
        }
        const catalogIndex = buildLocalCatalogIndex(localLibraryCatalog);
        const link = resolveLocalCatalogLink(localLibraryCatalog, surfaceProps.localSongs, {
            kind: 'album',
            entityId: String(albumId),
            name: albumName,
        }, catalogIndex);
        if (!link) return;
        const albumArtist = resolveLocalAlbumArtistDisplay(link.songs.map(song => song.id), localLibraryCatalog);
        onPushCollection({
            source: 'local',
            id: link.entity.id,
            entityId: link.entity.id,
            name: link.entity.displayName,
            type: 'album',
            coverUrl: albumCoverUrl,
            description: albumArtist,
            albumArtist,
            songIds: link.songs.map(song => song.id),
        });
    }, [localLibraryCatalog, onPushCollection, selectedCollection, surfaceProps.localSongs]);

    useEffect(() => {
        if (!selectedCollection || isPlayerOpen) return undefined;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || event.repeat || event.defaultPrevented) return;
            if (hasBlockingWindow() || hasOpenSheet()) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            onBackCollection();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isPlayerOpen, onBackCollection, selectedCollection]);

    if (!selectedCollection) return null;

    return (
        <div className="fixed inset-0 z-[60]">
            {isArtist ? (
                <MinimalistArtistView
                    collection={selectedCollection}
                    resource={artistResource}
                    playback={playbackPort}
                    currentSong={currentSong}
                    palette={palette}
                    onBack={onBackCollection}
                    onOpenAlbum={handleOpenAlbum}
                />
            ) : (
                <MinimalistCollectionView
                    collection={selectedCollection}
                    resource={collectionResource}
                    playback={playbackPort}
                    currentSong={currentSong}
                    palette={palette}
                    onBack={onBackCollection}
                />
            )}
        </div>
    );
};

export default MinimalistCollectionHost;
