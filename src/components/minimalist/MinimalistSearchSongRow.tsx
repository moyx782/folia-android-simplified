import React from 'react';
import type { RowComponentProps } from 'react-window';
import { Disc3, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UnifiedSong } from '../../types';
import type { MediaId } from '../../types/onlineMusic';
import { canResolveSongCatalogRef } from '../../services/onlineMusic/catalogRefs';
import { getSongTag, isSongUnavailable } from '../../services/onlineMusic/songAvailability';
import { getProviderSongMetadata, getSongCoverUrl } from '../../services/onlineMusic/songMetadata';
import { getSizedCoverUrl } from '../../utils/coverUrl';
import type { MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/MinimalistSearchSongRow.tsx
// Virtualized row renderer for Minimalist Mode song search results with availability & clickable artist/album links.

export type SearchSongRowData = {
    songs: UnifiedSong[];
    palette: MinimalistThemePalette;
    onPlayTrack: (track: UnifiedSong) => void;
    onAddTrackToQueue: (track: UnifiedSong) => void;
    onOpenArtist: (track: UnifiedSong, artistName: string, artistId?: MediaId, entityId?: string) => void;
    onOpenAlbum: (track: UnifiedSong, albumName: string, albumId?: MediaId, entityId?: string) => void;
};

export const SEARCH_SONG_ROW_HEIGHT = 64;

const readNavidromeId = (song: UnifiedSong, field: 'artistId' | 'albumId'): string | undefined => {
    if (!song.isNavidrome) return undefined;
    const raw: unknown = song.navidromeData;
    const descriptor = raw !== null && typeof raw === 'object' ? Object.getOwnPropertyDescriptor(raw, field) : undefined;
    return typeof descriptor?.value === 'string' && descriptor.value.length > 0 ? descriptor.value : undefined;
};

export const MinimalistSearchSongRow = ({
    index,
    style,
    ariaAttributes,
    songs,
    palette,
    onPlayTrack,
    onAddTrackToQueue,
    onOpenArtist,
    onOpenAlbum,
}: RowComponentProps<SearchSongRowData>) => {
    const { t } = useTranslation();
    const song = songs[index];
    const isUnavailable = isSongUnavailable(song);
    const tag = getSongTag(song, { unavailable: t('status.songUnavailableTag'), video: t('status.songVideoTag') });
    const coverUrl = getSizedCoverUrl(getSongCoverUrl(song), 256);
    const metadata = getProviderSongMetadata(song);
    const artists = metadata.artists;
    const album = metadata.album;
    const canOpenAlbum = Boolean(album.name && (
        song.isLocal ? album.entityId
            : song.isNavidrome ? readNavidromeId(song, 'albumId')
                : canResolveSongCatalogRef(song, 'album', album)
    ));

    return (
        <div
            {...ariaAttributes}
            style={{ ...style, borderBottom: `1px solid ${palette.borderColor}`, opacity: isUnavailable ? 0.55 : 1 }}
            className="flex items-center gap-3 px-4"
        >
            <button
                type="button"
                aria-label={song.name}
                disabled={isUnavailable}
                onClick={() => onPlayTrack(song)}
                className="w-10 h-10 rounded-lg shrink-0 overflow-hidden flex items-center justify-center disabled:cursor-not-allowed"
                style={{ backgroundColor: palette.mutedBg }}
            >
                {coverUrl ? (
                    <img src={coverUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                ) : (
                    <Disc3 size={16} style={{ color: palette.textSecondary }} />
                )}
            </button>
            <div className="min-w-0 flex-1 py-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                    <button
                        type="button"
                        disabled={isUnavailable}
                        onClick={() => onPlayTrack(song)}
                        className="min-w-0 truncate text-left text-sm font-medium disabled:cursor-not-allowed"
                        style={{ color: palette.textPrimary }}
                    >
                        {song.name}
                    </button>
                    {tag && (
                        <span className="shrink-0 rounded px-1 py-px text-[10px] border" style={{ borderColor: palette.borderColor, color: palette.textSecondary }}>
                            {tag}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 text-xs truncate" style={{ color: palette.textSecondary }}>
                    <span className="min-w-0 truncate">
                        {artists.map((artist, artistIndex) => {
                            const canOpenArtist = Boolean(
                                song.isLocal ? artist.entityId
                                    : song.isNavidrome ? readNavidromeId(song, 'artistId')
                                        : canResolveSongCatalogRef(song, 'artist', artist),
                            );
                            return (
                                <React.Fragment key={`${artist.entityId || artist.id}-${artistIndex}`}>
                                    {artistIndex > 0 && ', '}
                                    <button
                                        type="button"
                                        disabled={!canOpenArtist}
                                        onClick={() => onOpenArtist(song, artist.name, artist.id, artist.entityId)}
                                        className="enabled:hover:underline disabled:cursor-default"
                                    >
                                        {artist.name}
                                    </button>
                                </React.Fragment>
                            );
                        })}
                    </span>
                    {album.name && (
                        <>
                            <span aria-hidden="true">·</span>
                            <button
                                type="button"
                                disabled={!canOpenAlbum}
                                onClick={() => onOpenAlbum(song, album.name, album.id, album.entityId)}
                                className="truncate enabled:hover:underline disabled:cursor-default"
                            >
                                {album.name}
                            </button>
                        </>
                    )}
                </div>
            </div>
            <button
                type="button"
                aria-label={t('minimalist.player.addToQueue')}
                onClick={() => onAddTrackToQueue(song)}
                className="p-2 rounded-lg shrink-0"
                style={{ color: palette.textSecondary }}
            >
                <Plus size={16} />
            </button>
        </div>
    );
};
