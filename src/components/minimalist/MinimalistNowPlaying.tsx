import React, { useState } from 'react';
import {
    ChevronDown,
    Disc3,
    FileText,
    Heart,
    PlusCircle,
    SlidersHorizontal,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LyricData, PlayerState, SongResult } from '../../types';
import { canOpenPlaylistPickerFor, openAddToPlaylist } from '../../stores/useAddToPlaylistStore';
import { getSongAlbumLabel, getSongArtistLabel, getSongCoverUrl } from '../../services/onlineMusic/songMetadata';
import { getSizedCoverUrl } from '../../utils/coverUrl';
import MinimalistLyricsPane from './MinimalistLyricsPane';
import MinimalistNowPlayingControls from './MinimalistNowPlayingControls';
import type { MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/MinimalistNowPlaying.tsx
// Standard full-screen Now Playing page for Minimalist Mode with cover/plain-lyrics toggle and standard controls.

type MinimalistNowPlayingProps = {
    isOpen: boolean;
    currentSong: SongResult | null;
    playerState: PlayerState;
    duration: number;
    effectiveLoopMode: 'off' | 'all' | 'one';
    lyrics: LyricData | null;
    currentLineIndex: number;
    isLiked: boolean;
    canTogglePlayback: boolean;
    isControlDisabled: boolean;
    palette: MinimalistThemePalette;
    onClose: () => void;
    onTogglePlay: () => void;
    onPrevTrack: () => void;
    onNextTrack: () => void;
    onToggleLoop: () => void;
    onShuffleQueue: () => void;
    onToggleLike: () => void;
    onSeek: (timeSec: number) => void;
    onOpenQueue: () => void;
    onOpenLyricMatch: () => void;
};

const MinimalistNowPlaying: React.FC<MinimalistNowPlayingProps> = ({
    isOpen,
    currentSong,
    playerState,
    duration,
    effectiveLoopMode,
    lyrics,
    currentLineIndex,
    isLiked,
    canTogglePlayback,
    isControlDisabled,
    palette,
    onClose,
    onTogglePlay,
    onPrevTrack,
    onNextTrack,
    onToggleLoop,
    onShuffleQueue,
    onToggleLike,
    onSeek,
    onOpenQueue,
    onOpenLyricMatch,
}) => {
    const { t } = useTranslation();
    const [showLyrics, setShowLyrics] = useState(false);

    if (!isOpen) return null;

    const coverUrl = currentSong ? getSizedCoverUrl(getSongCoverUrl(currentSong), 512) : '';
    const artistLabel = getSongArtistLabel(currentSong);
    const albumLabel = getSongAlbumLabel(currentSong);
    const canAddToPlaylist = currentSong ? canOpenPlaylistPickerFor(currentSong) : false;

    return (
        <div
            className="fixed inset-0 z-[90] flex flex-col"
            style={{
                backgroundColor: palette.pageBg,
                paddingTop: 'max(env(safe-area-inset-top, 0px), var(--window-buttons-drop, 0px))',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3">
                <button
                    type="button"
                    aria-label={t('ui.back')}
                    onClick={onClose}
                    className="p-2 rounded-full"
                    style={{ color: palette.textPrimary, backgroundColor: palette.mutedBg }}
                >
                    <ChevronDown size={20} />
                </button>
                <div className="min-w-0 flex-1 text-center">
                    <div className="text-sm font-semibold truncate" style={{ color: palette.textPrimary }}>
                        {currentSong?.name || t('ui.noTrack')}
                    </div>
                    <div className="text-xs truncate" style={{ color: palette.textSecondary }}>
                        {artistLabel || albumLabel || t('player.unknownArtist')}
                    </div>
                </div>
                <div className="shrink-0 flex items-center gap-1">
                    <button
                        type="button"
                        aria-label={showLyrics ? t('minimalist.player.coverView') : t('minimalist.player.lyricsView')}
                        onClick={() => setShowLyrics(prev => !prev)}
                        className="p-2 rounded-full"
                        style={{
                            color: showLyrics ? palette.accentColor : palette.textSecondary,
                            backgroundColor: palette.mutedBg,
                        }}
                    >
                        <FileText size={18} />
                    </button>
                    <button
                        type="button"
                        aria-label={t('ui.lyricsMatchSearch')}
                        disabled={!currentSong}
                        onClick={onOpenLyricMatch}
                        className="p-2 rounded-full disabled:opacity-40"
                        style={{ color: palette.textSecondary, backgroundColor: palette.mutedBg }}
                    >
                        <SlidersHorizontal size={18} />
                    </button>
                </div>
            </div>

            <div className="min-h-0 flex-1 px-6 py-2 flex flex-col">
                {showLyrics ? (
                    <MinimalistLyricsPane
                        isOpen={isOpen}
                        lyrics={lyrics}
                        currentLineIndex={currentLineIndex}
                        palette={palette}
                        onSeek={onSeek}
                    />
                ) : (
                    <div className="min-h-0 flex-1 flex flex-col items-center justify-center gap-6">
                        <button
                            type="button"
                            aria-label={t('minimalist.player.lyricsView')}
                            onClick={() => setShowLyrics(true)}
                            className="w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden border flex items-center justify-center shrink-0"
                            style={{ backgroundColor: palette.surfaceBg, borderColor: palette.borderColor }}
                        >
                            {coverUrl ? (
                                <img src={coverUrl} alt="" className="w-full h-full object-cover" decoding="async" />
                            ) : (
                                <Disc3 size={56} style={{ color: palette.textSecondary }} />
                            )}
                        </button>
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                aria-label={isLiked ? t('player.unlike') : t('player.like')}
                                disabled={!currentSong}
                                onClick={onToggleLike}
                                className="p-2.5 rounded-full disabled:opacity-40"
                                style={{ backgroundColor: palette.mutedBg, color: isLiked ? '#ef4444' : palette.textSecondary }}
                            >
                                <Heart size={20} fill={isLiked ? '#ef4444' : 'none'} />
                            </button>
                            {canAddToPlaylist && (
                                <button
                                    type="button"
                                    aria-label={t('minimalist.player.addToPlaylist')}
                                    onClick={openAddToPlaylist}
                                    className="p-2.5 rounded-full"
                                    style={{ backgroundColor: palette.mutedBg, color: palette.textSecondary }}
                                >
                                    <PlusCircle size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <MinimalistNowPlayingControls
                hasSong={Boolean(currentSong)}
                playerState={playerState}
                duration={duration}
                effectiveLoopMode={effectiveLoopMode}
                canTogglePlayback={canTogglePlayback}
                isControlDisabled={isControlDisabled}
                palette={palette}
                onTogglePlay={onTogglePlay}
                onPrevTrack={onPrevTrack}
                onNextTrack={onNextTrack}
                onToggleLoop={onToggleLoop}
                onShuffleQueue={onShuffleQueue}
                onSeek={onSeek}
                onOpenQueue={onOpenQueue}
            />
        </div>
    );
};

export default MinimalistNowPlaying;
