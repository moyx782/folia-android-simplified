import React from 'react';
import { ListMusic, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PlayerState } from '../../types';
import MinimalistSeekBar from './MinimalistSeekBar';
import type { MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/MinimalistNowPlayingControls.tsx
// Playback progress bar and transport controls deck for the Minimalist Now Playing screen.

type MinimalistNowPlayingControlsProps = {
    hasSong: boolean;
    playerState: PlayerState;
    duration: number;
    effectiveLoopMode: 'off' | 'all' | 'one';
    canTogglePlayback: boolean;
    canShuffle: boolean;
    isControlDisabled: boolean;
    compact?: boolean;
    palette: MinimalistThemePalette;
    onAccentColor?: string;
    onTogglePlay: () => void;
    onPrevTrack: () => void;
    onNextTrack: () => void;
    onToggleLoop: () => void;
    onShuffleQueue: () => void;
    onSeek: (timeSec: number) => void;
    onOpenQueue: () => void;
};

const MinimalistNowPlayingControls: React.FC<MinimalistNowPlayingControlsProps> = ({
    hasSong,
    playerState,
    duration,
    effectiveLoopMode,
    canTogglePlayback,
    canShuffle,
    isControlDisabled,
    compact = false,
    palette,
    onAccentColor = palette.onAccentColor,
    onTogglePlay,
    onPrevTrack,
    onNextTrack,
    onToggleLoop,
    onShuffleQueue,
    onSeek,
    onOpenQueue,
}) => {
    const { t } = useTranslation();
    const isPlaying = playerState === PlayerState.PLAYING;
    const loopLabel = effectiveLoopMode === 'one'
        ? t('player.loopOne')
        : effectiveLoopMode === 'all'
            ? t('player.loopAll')
            : t('player.loopOff');

    return (
        <div className={compact ? 'shrink-0 px-5 pb-4 pt-1 max-w-xl w-full mx-auto space-y-2.5' : 'shrink-0 w-full max-w-xl mx-auto space-y-3'}>
            <MinimalistSeekBar duration={duration} disabled={!hasSong || isControlDisabled} palette={palette} onSeek={onSeek} />
            <div className="flex items-center justify-between gap-1">
                <button
                    type="button"
                    aria-label={t('minimalist.player.shuffle')}
                    disabled={!canShuffle || isControlDisabled}
                    onClick={onShuffleQueue}
                    className="p-2.5 rounded-full disabled:opacity-40"
                    style={{ color: palette.textSecondary }}
                >
                    <Shuffle size={18} />
                </button>
                <button
                    type="button"
                    aria-label={t('ui.previousTrack')}
                    disabled={!hasSong || isControlDisabled}
                    onClick={onPrevTrack}
                    className="p-2.5 rounded-full disabled:opacity-40"
                    style={{ color: palette.textPrimary }}
                >
                    <SkipBack size={22} />
                </button>
                <button
                    type="button"
                    aria-label={isPlaying ? t('player.pause') : t('player.play')}
                    disabled={!canTogglePlayback || isControlDisabled}
                    onClick={onTogglePlay}
                    className={compact ? 'w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-40' : 'w-14 h-14 rounded-full flex items-center justify-center disabled:opacity-40'}
                    style={{ backgroundColor: palette.accentColor, color: onAccentColor }}
                >
                    {isPlaying ? <Pause size={compact ? 22 : 25} /> : <Play size={compact ? 22 : 25} className="ml-0.5" />}
                </button>
                <button
                    type="button"
                    aria-label={t('ui.nextTrack')}
                    disabled={!hasSong || isControlDisabled}
                    onClick={onNextTrack}
                    className="p-2.5 rounded-full disabled:opacity-40"
                    style={{ color: palette.textPrimary }}
                >
                    <SkipForward size={22} />
                </button>
                <button
                    type="button"
                    aria-label={loopLabel}
                    disabled={!hasSong || isControlDisabled}
                    onClick={onToggleLoop}
                    className="p-2.5 rounded-full disabled:opacity-40"
                    style={{ color: effectiveLoopMode === 'off' ? palette.textSecondary : palette.accentColor }}
                >
                    {effectiveLoopMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
                </button>
                <button
                    type="button"
                    aria-label={t('minimalist.player.queueTitle')}
                    onClick={onOpenQueue}
                    className="p-2.5 rounded-full"
                    style={{ color: palette.textSecondary }}
                >
                    <ListMusic size={18} />
                </button>
            </div>
        </div>
    );
};

export default MinimalistNowPlayingControls;
