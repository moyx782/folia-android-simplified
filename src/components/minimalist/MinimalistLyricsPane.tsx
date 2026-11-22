import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { LyricData } from '../../types';
import type { MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/MinimalistLyricsPane.tsx
// Lightweight static lyrics list for Minimalist Mode that scrolls only when the active line changes.

type MinimalistLyricsPaneProps = {
    isOpen: boolean;
    lyrics: LyricData | null;
    currentLineIndex: number;
    palette: MinimalistThemePalette;
    onSeek: (timeSec: number) => void;
};

const MinimalistLyricsPane: React.FC<MinimalistLyricsPaneProps> = ({
    isOpen,
    lyrics,
    currentLineIndex,
    palette,
    onSeek,
}) => {
    const { t } = useTranslation();
    const activeLineRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen || currentLineIndex < 0) return;
        activeLineRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
    }, [currentLineIndex, isOpen]);

    const lines = lyrics?.lines ?? [];

    if (lines.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-sm" style={{ color: palette.textSecondary }}>
                {t('minimalist.player.noLyrics')}
            </div>
        );
    }

    return (
        <div className="min-h-0 flex-1 overflow-y-auto py-8 space-y-3 text-center">
            {lines.map((line, index) => {
                const active = index === currentLineIndex;
                const subText = line.translation || line.romanization;
                return (
                    <button
                        key={`${line.startTime}-${index}`}
                        ref={active ? activeLineRef : undefined}
                        type="button"
                        onClick={() => onSeek(line.startTime)}
                        className="block w-full py-1.5 px-2 rounded-lg text-center"
                    >
                        <div
                            className={active ? 'text-lg font-semibold leading-snug' : 'text-sm leading-snug'}
                            style={{ color: active ? palette.textPrimary : palette.textSecondary }}
                        >
                            {line.fullText}
                        </div>
                        {subText && (
                            <div
                                className="text-xs mt-0.5 leading-snug"
                                style={{ color: palette.textSecondary, opacity: active ? 0.9 : 0.65 }}
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
