import React, { useState } from 'react';
import { ChevronDown, Disc3, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LyricData, PlayerState, SongResult } from '../../types';
import { usePlaybackStore } from '../../stores/usePlaybackStore';
import { getSongCoverUrl } from '../../services/onlineMusic/songMetadata';
import { isStagePlaybackSong } from '../../utils/appPlaybackGuards';
import { getSizedCoverUrl } from '../../utils/coverUrl';
import { resolveLikeAvailability } from '../../utils/playerLikeAvailability';
import MinimalistLyricsPane from './MinimalistLyricsPane';
import MinimalistNowPlayingControls from './MinimalistNowPlayingControls';
import MinimalistPlayerMetaRow from './MinimalistPlayerMetaRow';
import { useIsWidePlayerLayout, useMinimalistCoverAmbient } from './useMinimalistCoverAmbient';
import type { MinimalistPlayingSongLinks, MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/MinimalistNowPlaying.tsx
// SPlayer-style Minimalist Now Playing surface with static cover-extracted ambient backdrop,
// portrait cover/lyrics switcher, and wide/landscape two-column split layout.

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
    onSeekLyricLine: (lyricTimeSec: number) => void;
    playingSongLinks: MinimalistPlayingSongLinks;
    onOpenQueue: () => void;
    onOpenLyricMatch: () => void;
};

const MinimalistNowPlaying: React.FC<MinimalistNowPlayingProps> = ({
    isOpen, currentSong, playerState, duration, effectiveLoopMode, lyrics, currentLineIndex,
    isLiked, canTogglePlayback, isControlDisabled, palette, onClose, onTogglePlay, onPrevTrack,
    onNextTrack, onToggleLoop, onShuffleQueue, onToggleLike, onSeek, onSeekLyricLine,
    playingSongLinks, onOpenQueue, onOpenLyricMatch,
}) => {
    const { t } = useTranslation();
    const [showLyrics, setShowLyrics] = useState(false);
    const isWideLayout = useIsWidePlayerLayout();
    const canShuffle = usePlaybackStore(state => !state.isFmMode && state.playQueue.length > 1);
    const rawCoverUrl = currentSong ? (getSongCoverUrl(currentSong) ?? '') : '';
    const ambient = useMinimalistCoverAmbient(isOpen, rawCoverUrl, palette);

    if (!isOpen) return null;

    const ap = ambient.palette;
    const isStage = isStagePlaybackSong(currentSong);
    const likeAvailability = resolveLikeAvailability(currentSong, isControlDisabled, isStage);
    const coverUrl = rawCoverUrl ? getSizedCoverUrl(rawCoverUrl, 512) : '';
    const coverContent = coverUrl
        ? <img src={coverUrl} alt="" className="w-full h-full object-cover" decoding="async" />
        : <Disc3 size={56} style={{ color: ap.textSecondary }} />;

    const controlsProps = {
        hasSong: Boolean(currentSong), playerState, duration, effectiveLoopMode, canTogglePlayback,
        canShuffle, isControlDisabled, palette: ap, onAccentColor: ambient.onAccentColor,
        onTogglePlay, onPrevTrack, onNextTrack, onToggleLoop, onShuffleQueue, onSeek, onOpenQueue,
    };
    const metaBaseProps = {
        currentSong, isLiked, isLikeDisabled: likeAvailability.disabled,
        palette: ap, links: playingSongLinks, onToggleLike,
    };
    const lyricsPane = (
        <MinimalistLyricsPane
            isOpen={isOpen} lyrics={lyrics} currentLineIndex={currentLineIndex}
            palette={ap} disabled={isControlDisabled} onSeek={onSeekLyricLine}
        />
    );

    return (
        <div
            data-testid="minimalist-now-playing"
            className="fixed inset-0 z-[90] flex flex-col"
            style={{
                backgroundColor: ap.pageBg,
                backgroundImage: ambient.backgroundImage,
                paddingTop: 'max(env(safe-area-inset-top, 0px), var(--window-buttons-drop, 0px))',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                paddingLeft: 'env(safe-area-inset-left, 0px)',
                paddingRight: 'env(safe-area-inset-right, 0px)',
            }}
        >
            <div className="shrink-0 flex items-center justify-between gap-2 px-4 sm:px-6 py-3">
                <button type="button" aria-label={t('ui.back')} onClick={onClose} className="p-2 rounded-full" style={{ color: ap.textPrimary, backgroundColor: ap.mutedBg }}>
                    <ChevronDown size={20} />
                </button>
                {!isWideLayout && (
                    <div role="tablist" className="flex items-center rounded-full p-0.5 border" style={{ backgroundColor: ap.mutedBg, borderColor: ap.borderColor }}>
                        <button role="tab" type="button" aria-selected={!showLyrics} onClick={() => setShowLyrics(false)} className="rounded-full px-3.5 py-1 text-xs font-medium" style={!showLyrics ? { backgroundColor: ap.surfaceBg, color: ap.textPrimary } : { color: ap.textSecondary }}>
                            {t('minimalist.player.coverShort')}
                        </button>
                        <button role="tab" type="button" aria-selected={showLyrics} onClick={() => setShowLyrics(true)} className="rounded-full px-3.5 py-1 text-xs font-medium" style={showLyrics ? { backgroundColor: ap.surfaceBg, color: ap.textPrimary } : { color: ap.textSecondary }}>
                            {t('minimalist.player.lyricsShort')}
                        </button>
                    </div>
                )}
                <button
                    type="button"
                    aria-label={t('ui.lyricsMatchSearch')}
                    disabled={!currentSong || isStage || isControlDisabled}
                    onClick={onOpenLyricMatch}
                    className="p-2 rounded-full disabled:opacity-40"
                    style={{ color: ap.textSecondary, backgroundColor: ap.mutedBg }}
                >
                    <SlidersHorizontal size={18} />
                </button>
            </div>

            {isWideLayout ? (
                <div className="min-h-0 flex-1 w-full max-w-6xl mx-auto px-8 pb-8 pt-2 flex items-center gap-10">
                    <div className="w-[44%] max-w-[380px] max-h-full min-h-0 overflow-y-auto shrink-0 flex flex-col justify-center gap-4">
                        <div className="aspect-square w-[min(100%,300px,38dvh)] h-[min(300px,38dvh)] mx-auto rounded-2xl overflow-hidden border shadow-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: ap.surfaceBg, borderColor: ap.borderColor }}>
                            {coverContent}
                        </div>
                        <MinimalistPlayerMetaRow variant="full" {...metaBaseProps} />
                        <MinimalistNowPlayingControls {...controlsProps} />
                    </div>
                    <div className="min-w-0 flex-1 h-full min-h-0 flex flex-col">{lyricsPane}</div>
                </div>
            ) : !showLyrics ? (
                <div className="min-h-0 flex-1 flex flex-col overflow-y-auto">
                    <div className="min-h-0 flex-1 px-6 flex items-center justify-center py-2">
                        <button type="button" aria-label={t('minimalist.player.lyricsView')} onClick={() => setShowLyrics(true)} className="w-[min(16rem,36dvh)] h-[min(16rem,36dvh)] sm:w-[min(18rem,40dvh)] sm:h-[min(18rem,40dvh)] rounded-2xl overflow-hidden border shadow-xl flex items-center justify-center shrink-0" style={{ backgroundColor: ap.surfaceBg, borderColor: ap.borderColor }}>
                            {coverContent}
                        </button>
                    </div>
                    <div className="shrink-0 px-6 pb-6 space-y-4 w-full max-w-xl mx-auto">
                        <MinimalistPlayerMetaRow variant="full" {...metaBaseProps} />
                        <MinimalistNowPlayingControls {...controlsProps} />
                    </div>
                </div>
            ) : (
                <div className="min-h-0 flex-1 flex flex-col">
                    <div className="shrink-0 px-6 pt-1 pb-2 max-w-xl w-full mx-auto">
                        <MinimalistPlayerMetaRow variant="compact" {...metaBaseProps} onSwitchToCover={() => setShowLyrics(false)} />
                    </div>
                    <div className="min-h-0 flex-1 px-5 flex flex-col max-w-xl w-full mx-auto">{lyricsPane}</div>
                    <MinimalistNowPlayingControls compact {...controlsProps} />
                </div>
            )}
        </div>
    );
};

export default MinimalistNowPlaying;
