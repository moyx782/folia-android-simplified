// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ColorExtractorModule from '@/utils/colorExtractor';
import type * as ReactI18nextModule from 'react-i18next';
import { PlayerState, type LyricData, type UnifiedSong } from '@/types';
import { getContrastRatio } from '@/utils/themeColorMath';
import { usePlaybackStore } from '@/stores/usePlaybackStore';

const colorExtractorMock = vi.hoisted(() => ({
    extractRepresentativeColors: vi.fn().mockResolvedValue(['#3b82f6', '#8b5cf6']),
}));

vi.mock('react-i18next', async (importOriginal) => ({
    ...(await importOriginal<typeof ReactI18nextModule>()),
    useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/utils/colorExtractor', async (importOriginal) => {
    const actual = await importOriginal<typeof ColorExtractorModule>();
    return {
        ...actual,
        extractRepresentativeColors: colorExtractorMock.extractRepresentativeColors,
    };
});

import MinimalistNowPlaying from '@/components/minimalist/MinimalistNowPlaying';
import { createMinimalistPalette } from '@/components/minimalist/minimalistTypes';
import { resolveMinimalistCoverAmbient } from '@/components/minimalist/useMinimalistCoverAmbient';

// test/unit/minimalist/minimalistSPlayerNowPlaying.test.ts
// Verifies SPlayer-style Minimalist Now Playing layout, WCAG contrast clamping on extreme covers,
// positioned lyrics container + blank-line skipping, and control availability guards.

const createMockSong = (id: string, coverUrl: string): UnifiedSong => ({
    id,
    name: 'Test Track',
    artists: [{ id: 'artist-1', name: 'Singer A' }],
    album: { id: 'album-1', name: 'Album X', coverUrl },
    durationMs: 210000,
    sourceRef: { kind: 'online', providerId: 'netease', mediaId: id },
});

const sampleLyrics: LyricData = {
    lines: [
        { fullText: 'First lyric line', startTime: 10, endTime: 20, words: [] },
        { fullText: '', startTime: 20, endTime: 24, words: [] },
        { fullText: 'Second lyric line', startTime: 24.5, endTime: 35, words: [], translation: 'Second line translation' },
    ],
};

const stubMatchMedia = (matchesWide: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: (query: string) => ({
            matches: matchesWide,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }),
    });
};

const createBaseProps = (overrides?: Partial<React.ComponentProps<typeof MinimalistNowPlaying>>) => ({
    isOpen: true,
    currentSong: createMockSong('song-1', 'https://cover.test/a.jpg'),
    playerState: PlayerState.PLAYING,
    duration: 210,
    effectiveLoopMode: 'off' as const,
    lyrics: sampleLyrics,
    currentLineIndex: 0,
    isLiked: false,
    canTogglePlayback: true,
    isControlDisabled: false,
    palette: createMinimalistPalette(false, { accentColor: '#2563eb' } as never),
    onClose: vi.fn(),
    onTogglePlay: vi.fn(),
    onPrevTrack: vi.fn(),
    onNextTrack: vi.fn(),
    onToggleLoop: vi.fn(),
    onShuffleQueue: vi.fn(),
    onToggleLike: vi.fn(),
    onSeek: vi.fn(),
    onSeekLyricLine: vi.fn(),
    playingSongLinks: {
        openLocalArtist: vi.fn(),
        openLocalAlbum: vi.fn(),
        openNavidromeArtist: vi.fn(),
        openNavidromeAlbum: vi.fn(),
        openOnlineArtist: vi.fn(),
        openOnlineAlbum: vi.fn(),
    },
    onOpenQueue: vi.fn(),
    onOpenLyricMatch: vi.fn(),
    ...overrides,
});

describe('minimalist SPlayer-style Now Playing', () => {
    beforeEach(() => {
        (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
        colorExtractorMock.extractRepresentativeColors.mockClear();
        usePlaybackStore.setState({ isFmMode: false, playQueue: [createMockSong('1', ''), createMockSong('2', '')] });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('switches portrait Cover/Lyrics views, uses relative scroll parent, and omits blank lyric buttons', async () => {
        stubMatchMedia(false);
        const onSeekLyricLine = vi.fn();
        const props = createBaseProps({ onSeekLyricLine });
        const container = document.createElement('div');
        const root = createRoot(container);

        await act(async () => {
            root.render(React.createElement(MinimalistNowPlaying, props));
        });

        const screen = container.querySelector('[data-testid="minimalist-now-playing"]') as HTMLElement | null;
        expect(screen?.style.backgroundImage).toContain('radial-gradient');
        expect(colorExtractorMock.extractRepresentativeColors).toHaveBeenCalledTimes(1);
        expect(container.textContent).toContain('minimalist.player.coverShort');

        await act(async () => {
            container.querySelector('button[aria-label="minimalist.player.lyricsView"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });

        const lyricsScroll = container.querySelector('.relative.overflow-y-auto');
        expect(lyricsScroll).not.toBeNull();
        const lyricButtons = [...(lyricsScroll?.querySelectorAll('button') ?? [])];
        expect(lyricButtons).toHaveLength(2);
        const secondLineBtn = lyricButtons.find(btn => btn.textContent.includes('Second lyric line'));

        await act(async () => {
            secondLineBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
        expect(onSeekLyricLine).toHaveBeenCalledWith(24.5);

        await act(async () => {
            root.unmount();
        });
    });

    it('renders two-column split layout on wide screens and disables stage/unavailable controls', async () => {
        stubMatchMedia(true);
        usePlaybackStore.setState({ isFmMode: true, playQueue: [createMockSong('1', '')] });
        const props = createBaseProps({ isControlDisabled: true });
        const container = document.createElement('div');
        const root = createRoot(container);

        await act(async () => {
            root.render(React.createElement(MinimalistNowPlaying, props));
        });

        expect(container.textContent).not.toContain('minimalist.player.coverShort');
        expect(container.textContent).toContain('First lyric line');
        expect(colorExtractorMock.extractRepresentativeColors).not.toHaveBeenCalled();

        const shuffleBtn = container.querySelector('button[aria-label="minimalist.player.shuffle"]') as HTMLButtonElement;
        const loopBtn = container.querySelector('button[aria-label="player.loopOff"]') as HTMLButtonElement;
        const matchBtn = container.querySelector('button[aria-label="ui.lyricsMatchSearch"]') as HTMLButtonElement;
        const likeBtn = container.querySelector('button[aria-label="player.like"]') as HTMLButtonElement;
        expect(shuffleBtn.disabled).toBe(true);
        expect(loopBtn.disabled).toBe(true);
        expect(matchBtn.disabled).toBe(true);
        expect(likeBtn.disabled).toBe(true);

        const artistBtn = [...container.querySelectorAll('button')].find(btn => btn.textContent === 'Singer A');
        const albumBtn = [...container.querySelectorAll('button')].find(btn => btn.textContent === 'Album X');
        await act(async () => {
            artistBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            albumBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
        expect(props.playingSongLinks.openOnlineArtist).toHaveBeenCalledTimes(1);
        expect(props.playingSongLinks.openOnlineAlbum).toHaveBeenCalledTimes(1);

        await act(async () => {
            root.unmount();
        });
    });

    it('maintains WCAG contrast across pure white, pure black, and bright covers in both modes', () => {
        for (const isDaylight of [false, true]) {
            const base = createMinimalistPalette(isDaylight, { accentColor: '#2563eb' } as never);
            for (const swatch of ['#ffffff', '#000000', '#fde047', '#ef4444']) {
                const resolved = resolveMinimalistCoverAmbient(base, swatch, swatch);
                expect(getContrastRatio(resolved.onAccentColor, resolved.palette.accentColor)).toBeGreaterThanOrEqual(4.5);
                expect(getContrastRatio(resolved.palette.accentColor, resolved.palette.pageBg)).toBeGreaterThanOrEqual(3.5);
                expect(getContrastRatio(resolved.palette.textPrimary, resolved.palette.pageBg)).toBeGreaterThanOrEqual(7);
            }
        }
    });

    it('computes high-contrast onAccentColor for light monochrome accents and fallback coverless playback', async () => {
        const darkPalette = createMinimalistPalette(false, { accentColor: '#f4f4f5' } as never);
        expect(getContrastRatio(darkPalette.accentColor, darkPalette.surfaceBg)).toBeGreaterThanOrEqual(3.5);
        expect(getContrastRatio(darkPalette.onAccentColor, darkPalette.accentColor)).toBeGreaterThanOrEqual(4.5);
        expect(darkPalette.onAccentColor).toBe('#000000');

        const midTonePalette = createMinimalistPalette(false, { accentColor: '#6366f1' } as never);
        expect(getContrastRatio(midTonePalette.onAccentColor, midTonePalette.accentColor)).toBeGreaterThanOrEqual(4.5);

        const lightPalette = createMinimalistPalette(true, { accentColor: '#f4f4f5' } as never);
        expect(getContrastRatio(lightPalette.accentColor, lightPalette.surfaceBg)).toBeGreaterThanOrEqual(3.5);
        expect(getContrastRatio(lightPalette.onAccentColor, lightPalette.accentColor)).toBeGreaterThanOrEqual(4.5);

        stubMatchMedia(true);
        const container = document.createElement('div');
        const root = createRoot(container);
        await act(async () => {
            root.render(React.createElement(MinimalistNowPlaying, createBaseProps({
                currentSong: createMockSong('song-no-cover', ''),
                palette: darkPalette,
            })));
        });
        const pauseBtn = container.querySelector('button[aria-label="player.pause"]') as HTMLElement | null;
        expect(pauseBtn?.style.color).toBe('rgb(0, 0, 0)');

        await act(async () => {
            root.unmount();
        });
    });
});
