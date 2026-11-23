import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { LyricData } from '../../types';
import type { MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/MinimalistLyricsPane.tsx
// SPlayer-style left-aligned static lyrics view that centers the active line unless the user is manually scrolling.

type MinimalistLyricsPaneProps = {
    isOpen: boolean;
    lyrics: LyricData | null;
    currentLineIndex: number;
    palette: MinimalistThemePalette;
    disabled?: boolean;
    onSeek: (timeSec: number) => void;
};

const MANUAL_SCROLL_HOLD_MS = 3500;
const EDGE_FADE_MASK = 'linear-gradient(to bottom, transparent 0%, #000 8%, #000 92%, transparent 100%)';

const resolveLineOpacity = (index: number, currentLineIndex: number): number => {
    if (currentLineIndex < 0) return 0.72;
    const distance = Math.abs(index - currentLineIndex);
    if (distance === 0) return 1;
    if (distance === 1) return 0.54;
    if (distance === 2) return 0.38;
    return 0.25;
};

const MinimalistLyricsPane: React.FC<MinimalistLyricsPaneProps> = ({
    isOpen,
    lyrics,
    currentLineIndex,
    palette,
    disabled = false,
    onSeek,
}) => {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const activeLineRef = useRef<HTMLButtonElement>(null);
    const manualScrollUntilRef = useRef(0);

    useEffect(() => {
        manualScrollUntilRef.current = 0;
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
    }, [lyrics]);

    useEffect(() => {
        if (containerRef.current && currentLineIndex < 0 && Date.now() >= manualScrollUntilRef.current) {
            containerRef.current.scrollTop = 0;
        }
    }, [currentLineIndex]);

    useEffect(() => {
        if (!isOpen || currentLineIndex < 0) return;
        if (Date.now() < manualScrollUntilRef.current) return;
        const container = containerRef.current;
        const activeEl = activeLineRef.current;
        if (container && activeEl) {
            const targetTop = activeEl.offsetTop - container.clientHeight * 0.38 + activeEl.offsetHeight * 0.5;
            container.scrollTop = Math.max(0, targetTop);
        } else {
            activeEl?.scrollIntoView({ block: 'center', behavior: 'auto' });
        }
    }, [currentLineIndex, isOpen, lyrics]);

    const noteManualScroll = () => {
        manualScrollUntilRef.current = Date.now() + MANUAL_SCROLL_HOLD_MS;
    };

    const lines = lyrics?.lines ?? [];

    if (lines.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-sm" style={{ color: palette.textSecondary }}>
                {t('minimalist.player.noLyrics')}
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            onWheel={noteManualScroll}
            onTouchMove={noteManualScroll}
            className="relative min-h-0 flex-1 overflow-y-auto hide-scrollbar py-24 px-1 md:px-4 space-y-4 text-left"
            style={{ maskImage: EDGE_FADE_MASK, WebkitMaskImage: EDGE_FADE_MASK }}
        >
            {lines.map((line, index) => {
                const active = index === currentLineIndex;
                const subText = line.translation || line.romanization;
                if (!line.fullText.trim() && !subText) {
                    return <div key={`${line.startTime}-${index}`} className="h-4" aria-hidden="true" />;
                }
                return (
                    <button
                        key={`${line.startTime}-${index}`}
                        ref={active ? activeLineRef : undefined}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                            manualScrollUntilRef.current = 0;
                            onSeek(line.startTime);
                        }}
                        className="block w-full py-1.5 px-2 rounded-xl text-left disabled:cursor-default"
                        style={{ opacity: resolveLineOpacity(index, currentLineIndex) }}
                    >
                        <div
                            className={active ? 'text-xl sm:text-2xl font-bold leading-snug' : 'text-base sm:text-lg font-semibold leading-snug'}
                            style={{ color: active ? palette.textPrimary : palette.textSecondary }}
                        >
                            {line.fullText}
                        </div>
                        {subText && (
                            <div
                                className="text-xs sm:text-sm mt-1 leading-snug"
                                style={{ color: palette.textSecondary, opacity: active ? 0.92 : 0.72 }}
                            >
                                {subText}
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default MinimalistLyricsPane;
