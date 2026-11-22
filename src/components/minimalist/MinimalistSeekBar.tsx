import React, { useCallback, useEffect, useRef } from 'react';
import { useMotionValueEvent } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { currentTime } from '../../stores/motionSignals';
import { formatTime } from '../../utils/appPlaybackHelpers';
import type { MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/MinimalistSeekBar.tsx
// Minimalist playback scrubber driven directly by the `currentTime` MotionValue via DOM refs,
// keeping per-second progress updates free of React component re-renders.

type MinimalistSeekBarProps = {
    duration: number;
    disabled: boolean;
    palette: MinimalistThemePalette;
    onSeek: (timeSec: number) => void;
};

const SEEK_COMMIT_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']);

const MinimalistSeekBar: React.FC<MinimalistSeekBarProps> = ({ duration, disabled, palette, onSeek }) => {
    const { t } = useTranslation();
    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
    const fillRef = useRef<HTMLDivElement>(null);
    const currentLabelRef = useRef<HTMLSpanElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const draggingRef = useRef(false);

    const syncProgressDom = useCallback((seconds: number) => {
        const clamped = safeDuration > 0 ? Math.max(0, Math.min(seconds, safeDuration)) : 0;
        const ratio = safeDuration > 0 ? clamped / safeDuration : 0;
        if (fillRef.current) {
            fillRef.current.style.transform = `scaleX(${ratio})`;
        }
        if (currentLabelRef.current) {
            currentLabelRef.current.textContent = formatTime(clamped);
        }
        if (inputRef.current && !draggingRef.current) {
            inputRef.current.value = String(clamped);
        }
    }, [safeDuration]);

    useEffect(() => {
        syncProgressDom(currentTime.get());
    }, [syncProgressDom]);

    useMotionValueEvent(currentTime, 'change', (latest) => {
        if (!draggingRef.current) {
            syncProgressDom(latest);
        }
    });

    const cancelDrag = () => {
        draggingRef.current = false;
        syncProgressDom(currentTime.get());
    };

    const commitDrag = (value: number) => {
        draggingRef.current = false;
        if (!disabled && safeDuration > 0) {
            onSeek(Math.max(0, Math.min(value, safeDuration)));
        }
    };

    return (
        <div className="w-full select-none">
            <div className="relative h-6 flex items-center">
                <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: palette.mutedBg }}
                >
                    <div
                        ref={fillRef}
                        className="h-full w-full origin-left rounded-full"
                        style={{ backgroundColor: palette.accentColor, transform: 'scaleX(0)' }}
                    />
                </div>
                <input
                    ref={inputRef}
                    type="range"
                    aria-label={t('minimalist.player.seek')}
                    min={0}
                    max={safeDuration || 1}
                    step={0.1}
                    defaultValue={0}
                    disabled={disabled || safeDuration <= 0}
                    onPointerDown={(event) => {
                        draggingRef.current = true;
                        try {
                            event.currentTarget.setPointerCapture(event.pointerId);
                        } catch {
                            // Environments without full pointer-capture support (e.g. unit test DOMs).
                        }
                    }}
                    onChange={(event) => syncProgressDom(Number(event.target.value))}
                    onPointerUp={(event) => commitDrag(Number(event.currentTarget.value))}
                    onPointerCancel={cancelDrag}
                    onBlur={cancelDrag}
                    onKeyUp={(event) => {
                        if (SEEK_COMMIT_KEYS.has(event.key)) {
                            commitDrag(Number(event.currentTarget.value));
                        }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 touch-none cursor-pointer disabled:cursor-default"
                />
            </div>
            <div
                className="flex items-center justify-between text-[11px] font-mono tabular-nums"
                style={{ color: palette.textSecondary }}
            >
                <span ref={currentLabelRef}>0:00</span>
                <span>{formatTime(safeDuration)}</span>
            </div>
        </div>
    );
};

export default MinimalistSeekBar;
