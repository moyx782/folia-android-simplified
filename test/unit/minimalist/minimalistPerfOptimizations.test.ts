// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type * as PlatformModule from '@/utils/platform';
import type * as RegistryModule from '@/components/visualizer/registry';

const platformMock = vi.hoisted(() => ({
    IS_ANDROID_WEBVIEW: true,
    isAndroidNativeRuntime: () => true,
}));

const registryMock = vi.hoisted(() => ({
    prewarmSpy: vi.fn(),
}));

vi.mock('@/utils/platform', async (importOriginal) => {
    const actual = await importOriginal<typeof PlatformModule>();
    return {
        ...actual,
        IS_ANDROID_WEBVIEW: platformMock.IS_ANDROID_WEBVIEW,
        isAndroidNativeRuntime: platformMock.isAndroidNativeRuntime,
    };
});

vi.mock('@/components/visualizer/registry', async (importOriginal) => {
    const actual = await importOriginal<typeof RegistryModule>();
    return {
        ...actual,
        getVisualizerRegistryEntry: (mode: string) => ({
            mode,
            prewarm: registryMock.prewarmSpy,
        }),
    };
});

import {
    installFrameTimingDiagnostics,
    noteMotionActivity,
    resetFrameTimingDiagnostics,
} from '@/utils/frameTimingDiagnostics';
import { isBackgroundLyricHeld, setLyricHoldReason } from '@/components/app/backgroundThrottling/backgroundLyricHoldStore';
import { useBackgroundLyricHold } from '@/components/app/backgroundThrottling/useBackgroundLyricHold';
import { prewarmSavedVisualizer } from '@/components/visualizer/prewarmVisualizers';
import { useMinimalistModeStore } from '@/stores/useMinimalistModeStore';
import { useThemeSettingsStore } from '@/stores/useThemeSettingsStore';
import { useVisualizerSettingsStore } from '@/stores/useVisualizerSettingsStore';

// test/unit/minimalist/minimalistPerfOptimizations.test.ts
// Verifies baseline & Minimalist Mode performance optimizations: demand-driven rAF sampling,
// Android background visibility hold, and gating visualizer shader prewarming.

const HoldProbe: React.FC = () => {
    useBackgroundLyricHold();
    return null;
};

describe('baseline & minimalist performance optimizations', () => {
    beforeEach(() => {
        (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
        registryMock.prewarmSpy.mockClear();
        setLyricHoldReason('background', false);
        resetFrameTimingDiagnostics();
    });

    afterEach(() => {
        resetFrameTimingDiagnostics();
        vi.restoreAllMocks();
    });

    it('stops frame timing rAF after idle startup window and wakes on motion or resume', () => {
        let now = 1000;
        let nextId = 1;
        const callbacks = new Map<number, FrameRequestCallback>();

        vi.spyOn(performance, 'now').mockImplementation(() => now);
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
            const id = nextId++;
            callbacks.set(id, cb);
            return id;
        });
        vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
            callbacks.delete(id);
        });

        let visibility: DocumentVisibilityState = 'visible';
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            get: () => visibility,
        });

        installFrameTimingDiagnostics();
        expect(callbacks.size).toBe(1);

        // Advance past STARTUP_SAMPLE_WINDOW_MS (5000ms): the next frame runs and stops scheduling.
        now = 6500;
        const firstEntry = [...callbacks.entries()][0];
        callbacks.delete(firstEntry[0]);
        firstEntry[1](now);
        expect(callbacks.size).toBe(0);

        // Motion activity wakes the rAF sampling loop back up.
        noteMotionActivity();
        expect(callbacks.size).toBe(1);

        // Expire motion window cleanly, go hidden, then return visible to trigger resume sampling.
        now = 9000;
        const motionEntry = [...callbacks.entries()][0];
        callbacks.delete(motionEntry[0]);
        motionEntry[1](now);
        expect(callbacks.size).toBe(0);

        visibility = 'hidden';
        document.dispatchEvent(new Event('visibilitychange'));
        expect(callbacks.size).toBe(0);

        now = 10000;
        visibility = 'visible';
        document.dispatchEvent(new Event('visibilitychange'));
        expect(callbacks.size).toBe(1);
    });

    it('holds lyric/visualizer updates when Android WebView becomes hidden without Electron', () => {
        const originalElectron = window.electron;
        delete (window as { electron?: unknown }).electron;

        let visibility: DocumentVisibilityState = 'visible';
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            get: () => visibility,
        });

        const container = document.createElement('div');
        const root = createRoot(container);
        act(() => {
            root.render(React.createElement(HoldProbe));
        });
        expect(isBackgroundLyricHeld()).toBe(false);

        act(() => {
            visibility = 'hidden';
            document.dispatchEvent(new Event('visibilitychange'));
        });
        expect(isBackgroundLyricHeld()).toBe(true);

        act(() => {
            visibility = 'visible';
            document.dispatchEvent(new Event('visibilitychange'));
        });
        expect(isBackgroundLyricHeld()).toBe(false);

        act(() => {
            root.unmount();
        });
        window.electron = originalElectron;
    });

    it('skips visualizer shader prewarming when Minimalist Mode or Static Mode is enabled', () => {
        const savedMode = useVisualizerSettingsStore.getState().visualizerMode;

        useMinimalistModeStore.setState({ minimalistMode: true });
        useThemeSettingsStore.setState({ staticMode: false });
        prewarmSavedVisualizer();
        expect(registryMock.prewarmSpy).not.toHaveBeenCalled();

        useMinimalistModeStore.setState({ minimalistMode: false });
        useThemeSettingsStore.setState({ staticMode: true });
        prewarmSavedVisualizer();
        expect(registryMock.prewarmSpy).not.toHaveBeenCalled();

        useMinimalistModeStore.setState({ minimalistMode: false });
        useThemeSettingsStore.setState({ staticMode: false });
        prewarmSavedVisualizer();
        expect(registryMock.prewarmSpy).toHaveBeenCalledTimes(1);
        expect(savedMode).toBeTruthy();
    });
});
