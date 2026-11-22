// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ReactModule from 'react';
import type { LyricData } from '@/types';
import { PlayerState } from '@/types';
import { audioPower, currentTime, lyricCurrentTime } from '@/stores/motionSignals';
import { setCurrentLineIndex } from '@/stores/usePlaybackStore';
import { hifiMediaShim } from '@/services/hifi/hifiMediaShim';
import { usePlaybackVisualizerBridge } from '@/components/app/playback/bridges/usePlaybackVisualizerBridge';

// test/unit/minimalist/minimalistVisualizerBridge.test.ts
// Verifies Round-1 playback bridge fixes: keeping live spectrum when OBS is rendering in
// Minimalist Mode and syncing paused HiFi lyric/progress clocks on MediaShim boundary events.

const env = vi.hoisted(() => ({
    hifiPos: 0,
    effects: [] as Array<() => unknown>,
    cleanup: [] as Array<() => void>,
    state: {} as Record<string, unknown>,
}));

vi.mock('react', async (importOriginal) => ({
    ...(await importOriginal<typeof ReactModule>()),
    useCallback: (fn: unknown) => fn,
    useRef: (value: unknown) => ({ current: value }),
    useEffect: (fn: () => unknown) => { env.effects.push(fn); },
}));

vi.mock('@/stores/usePlaybackStore', () => ({
    usePlaybackStore: Object.assign(
        (selector: (state: Record<string, unknown>) => unknown) => selector(env.state),
        { getState: () => env.state, subscribe: () => () => {} },
    ),
    selectDisplayLyrics: (state: Record<string, unknown>) => state.lyrics,
    setCurrentLineIndex: vi.fn(),
    setHandoffLineIndex: vi.fn(),
    setPlayerState: vi.fn(),
}));

vi.mock('@/services/hifi/hifiPlayback', () => ({
    getHifiPosition: () => env.hifiPos,
}));

vi.mock('@/services/onlineMusic/omni', () => ({
    omni: { previewClipStartMsOfAudioSource: () => 0, audioSourceMetadataVersion: () => 0 },
}));

vi.mock('@/services/onlineMusic/externalPlayback', () => ({
    isExternalPlaybackSounding: () => false,
    getExternalPosition: () => 0,
}));

vi.mock('@/hooks/useBeatFxTrack', () => ({ useBeatFxTrack: () => false }));
vi.mock('@/services/beatFx/beatFxLive', () => ({ tickBeatFx: vi.fn() }));
vi.mock('@/services/automix/transitionCue', () => ({ getTransitionHandoffProgress: () => 0 }));

const lyrics: LyricData = {
    lines: [
        { fullText: 'line one', startTime: 5, endTime: 15, words: [] },
        { fullText: 'line two', startTime: 25, endTime: 40, words: [] },
    ],
};

const useMountBridge = (overrides: {
    visualizerMounted: boolean;
    minimalistMode: boolean;
    obsRendering: boolean;
}) => {
    const audio = { currentSrc: '', currentTime: 0, paused: true, ended: false } as HTMLAudioElement;
    usePlaybackVisualizerBridge({
        audioRef: { current: audio },
        analyserRef: { current: null },
        animationFrameRef: { current: 0 },
        effectiveLoopMode: 'off',
        isNowPlayingStageActive: false,
        isPlayerCapStageActive: false,
        stageActiveEntryKind: null,
        stageLyricsSession: null,
        stageLyricsClockRef: { current: { startTimeSec: 0, endTimeSec: 0, baseTimeSec: 0, startedAtMs: null } },
        getSyntheticStageLyricsTime: () => 0,
        syncStageLyricsClock: vi.fn(),
        getNowPlayingDisplayTime: () => 0,
        getPlayerCapDisplayTime: () => 0,
        syncNowPlayingClock: vi.fn(),
        lyricTimelineOffsetMs: 0,
        isTransitionAudible: () => false,
        ...overrides,
    });
    for (const effect of env.effects.splice(0)) {
        const cleanup = effect();
        if (typeof cleanup === 'function') env.cleanup.push(cleanup as () => void);
    }
};

describe('minimalist playback visualizer bridge', () => {
    beforeEach(() => {
        env.hifiPos = 0;
        env.effects.length = 0;
        env.cleanup.length = 0;
        audioPower.set(99);
        currentTime.set(0);
        lyricCurrentTime.set(0);
        vi.mocked(setCurrentLineIndex).mockClear();
    });

    afterEach(() => {
        for (const fn of env.cleanup.splice(0)) fn();
        vi.restoreAllMocks();
    });

    it('keeps spectrum idle breath and rAF alive in Minimalist Mode when obsRendering is true', () => {
        const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(42);
        vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
        vi.spyOn(Date, 'now').mockReturnValue(2000);

        env.state = {
            playbackRoute: 'web',
            lyrics,
            playerState: PlayerState.PLAYING,
            duration: 180,
            activePlaybackContext: 'default',
        };

        useMountBridge({
            visualizerMounted: false,
            minimalistMode: true,
            obsRendering: true,
        });
        expect(rafSpy).toHaveBeenCalledTimes(1);
        const firstFrame = rafSpy.mock.calls[0]?.[0];
        firstFrame?.(16);
        expect(audioPower.get()).toBeCloseTo((Math.sin(1) + 1) * 20, 6);

        for (const fn of env.cleanup.splice(0)) fn();
        rafSpy.mockClear();

        env.state = { ...env.state, playerState: PlayerState.PAUSED };
        useMountBridge({
            visualizerMounted: false,
            minimalistMode: true,
            obsRendering: false,
        });
        expect(rafSpy).not.toHaveBeenCalled();
        expect(audioPower.get()).toBe(0);
    });

    it('updates clock and lyrics when hifiMediaShim emits seeked while paused without visualizer', () => {
        const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
        env.hifiPos = 28;
        env.state = {
            playbackRoute: 'hifi',
            lyrics,
            playerState: PlayerState.PAUSED,
            duration: 180,
            activePlaybackContext: 'default',
            currentLineIndex: -1,
        };

        useMountBridge({
            visualizerMounted: false,
            minimalistMode: false,
            obsRendering: false,
        });
        expect(rafSpy).not.toHaveBeenCalled();
        expect(currentTime.get()).toBe(28);
        expect(setCurrentLineIndex).toHaveBeenCalledWith(1);

        env.hifiPos = 8;
        hifiMediaShim.dispatchEvent(new Event('seeked'));
        expect(currentTime.get()).toBe(8);
        expect(lyricCurrentTime.get()).toBe(8);
        expect(setCurrentLineIndex).toHaveBeenLastCalledWith(0);
    });
});
