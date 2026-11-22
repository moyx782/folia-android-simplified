import React, { useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, Disc3, Play, Shuffle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SongResult } from '../../types';
import type { LibraryArtistResource } from '../../library/core/artist/artist.contract';
import { useArtistResourceState } from '../../library/core/artist/useArtistResourceState';
import { useArtistView } from '../../library/core/artist/useArtistView';
import type { LibraryCollectionDescriptor } from '../../library/core/collection/collection.contract';
import type { LibraryPlaybackPort } from '../../library/core/shared/ports.contract';
import type { LibraryCatalogLinkHint, LibraryDeclaredActions } from '../../library/core/suite/suite.contract';
import { setStatusMessage } from '../../stores/useStatusMessageStore';
import { getSongArtistLabel, getSongDurationMs } from '../../services/onlineMusic/songMetadata';
import { formatTime } from '../../utils/appPlaybackHelpers';
import { isSamePlaybackSong } from '../../utils/appPlaybackGuards';
import { getSizedCoverUrl } from '../../utils/coverUrl';
import type { MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/MinimalistArtistView.tsx
// Standard static artist page for Minimalist Mode with top tracks and album list tabs.

const MINIMALIST_ARTIST_DECLARED_ACTIONS: LibraryDeclaredActions = {
    actions: ['play', 'enqueue', 'play-scope', 'shuffle-scope', 'enqueue-scope', 'open-album', 'reload', 'resume-sync'],
    extraActions: [],
};

type MinimalistArtistViewProps = {
    collection: LibraryCollectionDescriptor;
    resource: LibraryArtistResource | null;
    playback: LibraryPlaybackPort;
    currentSong: SongResult | null;
    palette: MinimalistThemePalette;
    onBack: () => void;
    onOpenAlbum: (albumId: number | string, album?: LibraryCatalogLinkHint) => void;
};

const MinimalistArtistView: React.FC<MinimalistArtistViewProps> = ({
    collection,
    resource,
    playback,
    currentSong,
    palette,
    onBack,
    onOpenAlbum,
}) => {
    const { t } = useTranslation();
    const [pane, setPane] = useState<'songs' | 'albums'>('songs');
    const { snapshot } = useArtistResourceState(resource);
    const artistView = useArtistView({
        collection,
        resource,
        snapshot,
        playback,
        declaredActions: MINIMALIST_ARTIST_DECLARED_ACTIONS,
        onOpenAlbum: (albumId, album) => onOpenAlbum(albumId, album),
        setStatus: setStatusMessage,
    });

    const songs = artistView.topSongs;
    const albums = artistView.shownAlbums;
    const detail = snapshot?.detail;
    const status = snapshot?.status ?? 'idle';
    const coverUrl = getSizedCoverUrl(detail?.coverUrl || collection.coverUrl, 256);

    const pillStyle = useMemo(() => (active: boolean) => ({
        backgroundColor: active ? palette.accentColor : palette.mutedBg,
        color: active ? '#ffffff' : palette.textPrimary,
    }), [palette.accentColor, palette.mutedBg, palette.textPrimary]);

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
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ backgroundColor: palette.mutedBg }}>
                    {coverUrl ? <img src={coverUrl} alt="" className="w-full h-full object-cover" /> : <Disc3 size={18} style={{ color: palette.textSecondary }} />}
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold truncate" style={{ color: palette.textPrimary }}>
                        {detail?.name || collection.name}
                    </h2>
                    <div className="text-xs truncate" style={{ color: palette.textSecondary }}>
                        {songs.length} {t('minimalist.collection.tracksUnit')} · {albums.length} {t('search.kindAlbum', 'Albums')}
                    </div>
                </div>
            </header>

            <div className="shrink-0 px-4 py-2.5 flex items-center gap-2 border-b" style={{ borderColor: palette.borderColor }}>
                <button type="button" onClick={() => setPane('songs')} className="rounded-full px-3.5 py-1 text-xs font-medium" style={pillStyle(pane === 'songs')}>
                    {t('search.kindSong', 'Songs')}
                </button>
                <button type="button" onClick={() => setPane('albums')} className="rounded-full px-3.5 py-1 text-xs font-medium" style={pillStyle(pane === 'albums')}>
                    {t('search.kindAlbum', 'Albums')}
                </button>
                <div className="ml-auto flex items-center gap-1.5">
                    <button
                        type="button"
                        aria-label={t('minimalist.collection.playAll')}
                        disabled={artistView.playableTopSongs.length === 0}
                        onClick={artistView.actions.playScope}
                        className="p-2 rounded-full disabled:opacity-40"
                        style={{ backgroundColor: palette.accentColor, color: '#ffffff' }}
                    >
                        <Play size={14} />
                    </button>
                    <button
                        type="button"
                        aria-label={t('minimalist.player.shuffle')}
                        disabled={artistView.playableTopSongs.length === 0}
                        onClick={artistView.actions.shuffleScope}
                        className="p-2 rounded-full disabled:opacity-40"
                        style={{ backgroundColor: palette.mutedBg, color: palette.textPrimary }}
                    >
                        <Shuffle size={14} />
                    </button>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {(status === 'idle' || status === 'loading') && (
                    <div className="py-12 text-center text-sm" style={{ color: palette.textSecondary }}>
                        {t('playlist.loading', 'Loading...')}
                    </div>
                )}
                {status !== 'idle' && status !== 'loading' && pane === 'songs' && songs.length === 0 && (
                    <div className="py-12 text-center text-sm" style={{ color: palette.textSecondary }}>
                        {t('minimalist.collection.empty')}
                    </div>
                )}
                {status !== 'idle' && status !== 'loading' && pane === 'songs' && songs.map((song, idx) => {
                    const active = isSamePlaybackSong(song, currentSong);
                    const durationSec = Math.round(getSongDurationMs(song) / 1000);
                    return (
                        <button
                            key={`${song.id}-${idx}`}
                            type="button"
                            onClick={() => artistView.actions.playSong(song)}
                            className="w-full flex items-center gap-3 rounded-xl border p-2.5 text-left"
                            style={{ backgroundColor: palette.surfaceBg, borderColor: palette.borderColor }}
                        >
                            <span className="w-6 text-center text-xs tabular-nums" style={{ color: active ? palette.accentColor : palette.textSecondary }}>
                                {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium truncate" style={{ color: active ? palette.accentColor : palette.textPrimary }}>
                                    {song.name}
                                </div>
                                <div className="text-xs truncate" style={{ color: palette.textSecondary }}>
                                    {getSongArtistLabel(song)}{durationSec > 0 ? ` · ${formatTime(durationSec)}` : ''}
                                </div>
                            </div>
                        </button>
                    );
                })}
                {status !== 'idle' && status !== 'loading' && pane === 'albums' && albums.length === 0 && (
                    <div className="py-12 text-center text-sm" style={{ color: palette.textSecondary }}>
                        {t('minimalist.collection.empty')}
                    </div>
                )}
                {status !== 'idle' && status !== 'loading' && pane === 'albums' && albums.map((album, idx) => {
                    const albumCover = getSizedCoverUrl(album.coverUrl, 256);
                    return (
                        <button
                            key={`${album.id}-${idx}`}
                            type="button"
                            onClick={() => artistView.actions.openAlbum(album)}
                            className="w-full flex items-center gap-3 rounded-xl border p-2.5 text-left"
                            style={{ backgroundColor: palette.surfaceBg, borderColor: palette.borderColor }}
                        >
                            <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ backgroundColor: palette.mutedBg }}>
                                {albumCover ? <img src={albumCover} alt="" loading="lazy" className="w-full h-full object-cover" /> : <Disc3 size={18} style={{ color: palette.textSecondary }} />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium truncate" style={{ color: palette.textPrimary }}>{album.name}</div>
                                {album.trackCount !== undefined && (
                                    <div className="text-xs" style={{ color: palette.textSecondary }}>
                                        {album.trackCount} {t('minimalist.collection.tracksUnit')}
                                    </div>
                                )}
                            </div>
                            <ChevronRight size={16} style={{ color: palette.textSecondary }} />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MinimalistArtistView;
