import React from 'react';
import { Disc3, Heart, PlusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Artist, SongResult, UnifiedSong } from '../../types';
import { canOpenPlaylistPickerFor, openAddToPlaylist } from '../../stores/useAddToPlaylistStore';
import { canResolveSongCatalogRef } from '../../services/onlineMusic/catalogRefs';
import { getProviderSongMetadata, getSongArtistLabel, getSongCoverUrl } from '../../services/onlineMusic/songMetadata';
import { isLocalPlaybackSong, isNavidromePlaybackSong, isStagePlaybackSong, resolveNavidromePlaybackCarrier } from '../../utils/appPlaybackGuards';
import { getSizedCoverUrl } from '../../utils/coverUrl';
import type { MinimalistPlayingSongLinks, MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/MinimalistPlayerMetaRow.tsx
// SPlayer-style track metadata, clickable artist/album navigation links, and like/playlist actions.

type MinimalistPlayerMetaRowProps = {
    variant: 'full' | 'compact';
    currentSong: SongResult | null;
    isLiked: boolean;
    isLikeDisabled: boolean;
    palette: MinimalistThemePalette;
    links: MinimalistPlayingSongLinks;
    onToggleLike: () => void;
    onSwitchToCover?: () => void;
};

const MinimalistPlayerMetaRow: React.FC<MinimalistPlayerMetaRowProps> = ({
    variant, currentSong, isLiked, isLikeDisabled, palette, links, onToggleLike, onSwitchToCover,
}) => {
    const { t } = useTranslation();
    const metadata = getProviderSongMetadata(currentSong);
    const artists = metadata.artists;
    const album = metadata.album;
    const artistLabel = getSongArtistLabel(currentSong) || t('player.unknownArtist');
    const coverUrl = currentSong ? getSizedCoverUrl(getSongCoverUrl(currentSong), 128) : '';
    const isStage = isStagePlaybackSong(currentSong);
    const isLocal = !isStage && isLocalPlaybackSong(currentSong);
    const isNavidrome = !isStage && isNavidromePlaybackSong(currentSong);
    const navidromeCarrier = isNavidrome ? resolveNavidromePlaybackCarrier(currentSong) : null;
    const canAddToPlaylist = Boolean(currentSong && !isStage && canOpenPlaylistPickerFor(currentSong));

    const canOpenAlbum = Boolean(currentSong && !isStage && album.name && (
        isLocal || (isNavidrome
            ? Boolean(navidromeCarrier?.navidromeData.albumId)
            : canResolveSongCatalogRef(currentSong as UnifiedSong, 'album', album))
    ));
    const canOpenArtist = (artist: Artist): boolean => Boolean(currentSong && !isStage && (
        isLocal ? Boolean(artist.name)
            : isNavidrome ? Boolean(navidromeCarrier?.navidromeData.artistId)
                : canResolveSongCatalogRef(currentSong as UnifiedSong, 'artist', artist)
    ));

    const openArtist = (artist: Artist) => {
        if (!currentSong || isStage) return;
        if (isLocal) { links.openLocalArtist(artist.entityId); return; }
        if (isNavidrome) { links.openNavidromeArtist(); return; }
        links.openOnlineArtist(currentSong, artist);
    };
    const openAlbum = () => {
        if (!currentSong || isStage) return;
        if (isLocal) { links.openLocalAlbum(); return; }
        if (isNavidrome) { links.openNavidromeAlbum(); return; }
        links.openOnlineAlbum(currentSong, album);
    };

    const likeButton = (
        <button
            type="button"
            aria-label={isLiked ? t('player.unlike') : t('player.like')}
            disabled={isLikeDisabled}
            onClick={onToggleLike}
            className="p-2 rounded-full shrink-0 disabled:opacity-40"
            style={{ backgroundColor: palette.mutedBg, color: isLiked ? '#ef4444' : palette.textSecondary }}
        >
            <Heart size={18} fill={isLiked ? '#ef4444' : 'none'} />
        </button>
    );

    if (variant === 'compact') {
        return (
            <div className="flex items-center gap-3 min-w-0">
                <button
                    type="button"
                    aria-label={t('minimalist.player.coverView')}
                    onClick={onSwitchToCover}
                    className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border flex items-center justify-center"
                    style={{ backgroundColor: palette.surfaceBg, borderColor: palette.borderColor }}
                >
                    {coverUrl ? <img src={coverUrl} alt="" className="w-full h-full object-cover" decoding="async" /> : <Disc3 size={18} style={{ color: palette.textSecondary }} />}
                </button>
                <div className="min-w-0 flex-1 text-left">
                    <div className="text-sm font-semibold truncate" style={{ color: palette.textPrimary }}>{currentSong?.name || t('ui.noTrack')}</div>
                    <div className="text-xs truncate" style={{ color: palette.textSecondary }}>{artistLabel}</div>
                </div>
                {likeButton}
            </div>
        );
    }

    return (
        <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="min-w-0 flex-1 text-left space-y-0.5">
                <div className="text-lg sm:text-xl font-bold truncate" style={{ color: palette.textPrimary }}>{currentSong?.name || t('ui.noTrack')}</div>
                <div className="flex items-center gap-1 text-xs sm:text-sm min-w-0" style={{ color: palette.textSecondary }}>
                    <span className="min-w-0 truncate">
                        {artists.length > 0 ? artists.map((artist, index) => (
                            <React.Fragment key={`${artist.entityId || artist.id}-${index}`}>
                                {index > 0 && ' / '}
                                <button
                                    type="button"
                                    disabled={!canOpenArtist(artist)}
                                    onClick={() => openArtist(artist)}
                                    className="enabled:hover:underline disabled:cursor-default"
                                >
                                    {artist.name}
                                </button>
                            </React.Fragment>
                        )) : artistLabel}
                    </span>
                    {album.name && (
                        <>
                            <span className="shrink-0" aria-hidden="true">·</span>
                            <button type="button" disabled={!canOpenAlbum} onClick={openAlbum} className="min-w-0 truncate enabled:hover:underline disabled:cursor-default">
                                {album.name}
                            </button>
                        </>
                    )}
                </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 pt-0.5">
                {likeButton}
                {canAddToPlaylist && (
                    <button
                        type="button"
                        aria-label={t('minimalist.player.addToPlaylist')}
                        onClick={openAddToPlaylist}
                        className="p-2 rounded-full"
                        style={{ backgroundColor: palette.mutedBg, color: palette.textSecondary }}
                    >
                        <PlusCircle size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default MinimalistPlayerMetaRow;
