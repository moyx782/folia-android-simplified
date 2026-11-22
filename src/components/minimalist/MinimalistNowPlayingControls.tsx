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
    isControlDisabled: boolean;
    palette: MinimalistThemePalette;
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
    isControlDisabled,
    palette,
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
        <div className="shrink-0 px-6 pb-6 pt-2 max-w-xl w-full mx-auto space-y-4">
            <MinimalistSeekBar duration={duration} disabled={!hasSong} palette={palette} onSeek={onSeek} />
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    aria-label={loopLabel}
                    onClick={onToggleLoop}
                    className="p-2.5 rounded-full"
                    style={{ color: effectiveLoopMode === 'off' ? palette.textSecondary : palette.accentColor }}
                >
                    {effectiveLoopMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
                </button>
                <button
                    type="button"
                    aria-label={t('ui.previousTrack')}
                    disabled={isControlDisabled}
                    onClick={onPrevTrack}
                    className="p-2.5 rounded-full disabled:opacity-40"
                    style={{ color: palette.textPrimary }}
                >
                    <SkipBack size={24} />
                </button>
                <button
                    type="button"
                    aria-label={isPlaying ? t('player.pause') : t('player.play')}
                    disabled={!canTogglePlayback || isControlDisabled}
                    onClick={onTogglePlay}
                    className="w-14 h-14 rounded-full flex items-center justify-center disabled:opacity-40"
                    style={{ backgroundColor: palette.accentColor, color: '#ffffff' }}
                >
                    {isPlaying ? <Pause size={26} /> : <Play size={26} className="ml-0.5" />}
                </button>
                <button
                    type="button"
                    aria-label={t('ui.nextTrack')}
                    disabled={isControlDisabled}
                    onClick={onNextTrack}
                    className="p-2.5 rounded-full disabled:opacity-40"
                    style={{ color: palette.textPrimary }}
                >
                    <SkipForward size={24} />
                </button>
                <button
                    type="button"
                    aria-label={t('minimalist.player.queueTitle')}
                    onClick={onOpenQueue}
                    className="p-2.5 rounded-full"
                    style={{ color: palette.textSecondary }}
                >
                    <ListMusic size={20} />
                </button>
            </div>
            <div className="flex justify-center">
                <button
                    type="button"
                    onClick={onShuffleQueue}
                    className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full"
                    style={{ backgroundColor: palette.mutedBg, color: palette.textSecondary }}
                >
                    <Shuffle size={12} />
                    <span>{t('minimalist.player.shuffle')}</span>
                </button>
            </div>
        </div>
    );
};

export default MinimalistNowPlayingControls;
