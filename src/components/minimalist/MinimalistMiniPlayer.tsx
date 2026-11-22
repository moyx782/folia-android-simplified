import React, { useCallback, useEffect, useRef } from 'react';
import { useMotionValueEvent } from 'framer-motion';
import { Disc3, ListMusic, Pause, Play, SkipForward } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PlayerState, type SongResult } from '../../types';
import { currentTime } from '../../stores/motionSignals';
import { getSongArtistLabel, getSongCoverUrl } from '../../services/onlineMusic/songMetadata';
import { getSizedCoverUrl } from '../../utils/coverUrl';
import type { MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/MinimalistMiniPlayer.tsx
// Standard docked mini-player bar sitting above bottom navigation, with direct MotionValue progress hairline.

type MinimalistMiniPlayerProps = {
    currentSong: SongResult | null;
    playerState: PlayerState;
    duration: number;
    canTogglePlayback: boolean;
    isControlDisabled: boolean;
    palette: MinimalistThemePalette;
    onOpenNowPlaying: () => void;
    onTogglePlay: () => void;
    onNextTrack: () => void;
    onOpenQueue: () => void;
};

const MinimalistMiniPlayer: React.FC<MinimalistMiniPlayerProps> = ({
    currentSong,
    playerState,
    duration,
    canTogglePlayback,
    isControlDisabled,
    palette,
    onOpenNowPlaying,
    onTogglePlay,
    onNextTrack,
    onOpenQueue,
}) => {
    const { t } = useTranslation();
    const progressRef = useRef<HTMLDivElement>(null);
    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;

    const syncHairline = useCallback((timeSec: number) => {
        if (!progressRef.current) return;
        const ratio = safeDuration > 0 ? Math.max(0, Math.min(timeSec / safeDuration, 1)) : 0;
        progressRef.current.style.transform = `scaleX(${ratio})`;
    }, [safeDuration]);

    useEffect(() => {
        syncHairline(currentTime.get());
    }, [currentSong, syncHairline]);

    useMotionValueEvent(currentTime, 'change', syncHairline);

    if (!currentSong) return null;

    const coverUrl = getSizedCoverUrl(getSongCoverUrl(currentSong), 256);
    const artistLabel = getSongArtistLabel(currentSong);
    const isPlaying = playerState === PlayerState.PLAYING;

    return (
        <div
            className="relative shrink-0 border-t"
            style={{ backgroundColor: palette.elevatedBg, borderColor: palette.borderColor }}
        >
            <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden" style={{ backgroundColor: palette.mutedBg }}>
                <div
                    ref={progressRef}
                    className="h-full w-full origin-left"
                    style={{ backgroundColor: palette.accentColor, transform: 'scaleX(0)' }}
                />
            </div>
            <div className="flex items-center gap-3 px-3 py-2">
                <button
                    type="button"
                    onClick={onOpenNowPlaying}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                    <div
                        className="w-10 h-10 rounded-lg shrink-0 overflow-hidden flex items-center justify-center"
                        style={{ backgroundColor: palette.mutedBg }}
                    >
                        {coverUrl ? (
                            <img src={coverUrl} alt="" className="w-full h-full object-cover" decoding="async" />
                        ) : (
                            <Disc3 size={18} style={{ color: palette.textSecondary }} />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate" style={{ color: palette.textPrimary }}>
                            {currentSong.name || t('ui.noTrack')}
                        </div>
                        <div className="text-xs truncate" style={{ color: palette.textSecondary }}>
                            {artistLabel || t('player.unknownArtist')}
                        </div>
                    </div>
                </button>
                <div className="shrink-0 flex items-center gap-1">
                    <button
                        type="button"
                        aria-label={isPlaying ? t('player.pause') : t('player.play')}
                        disabled={!canTogglePlayback || isControlDisabled}
                        onClick={onTogglePlay}
                        className="p-2 rounded-full disabled:opacity-40"
                        style={{ color: palette.textPrimary }}
                    >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button
                        type="button"
                        aria-label={t('ui.nextTrack')}
                        disabled={isControlDisabled}
                        onClick={onNextTrack}
                        className="p-2 rounded-full disabled:opacity-40"
                        style={{ color: palette.textPrimary }}
                    >
                        <SkipForward size={18} />
                    </button>
                    <button
                        type="button"
                        aria-label={t('minimalist.player.queueTitle')}
                        onClick={onOpenQueue}
                        className="p-2 rounded-full"
                        style={{ color: palette.textSecondary }}
                    >
                        <ListMusic size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MinimalistMiniPlayer;
