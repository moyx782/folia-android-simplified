// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as PlatformModule from '@/utils/platform';
import type * as NativeStageModule from '@/services/nativeStage';

const platformMock = vi.hoisted(() => ({
    IS_ANDROID_WEBVIEW: true,
    isAndroidNativeRuntime: () => true,
}));

const nativeStageMock = vi.hoisted(() => ({
    enableNativeStage: vi.fn().mockResolvedValue({ enabled: true }),
    disableNativeStage: vi.fn().mockResolvedValue(undefined),
    updateNativeStage: vi.fn().mockResolvedValue(undefined),
    addNativeStageControlListener: vi.fn().mockResolvedValue(() => undefined),
    addNativeStageFallbackListener: vi.fn().mockResolvedValue(() => undefined),
    getNativeStageStats: vi.fn().mockResolvedValue({ active: true }),
    updateNativeStageWords: vi.fn().mockResolvedValue(undefined),
    updateNativeStageProgress: vi.fn().mockResolvedValue(undefined),
    updateNativeStageAudio: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/utils/platform', async (importOriginal) => {
    const actual = await importOriginal<typeof PlatformModule>();
    return {
        ...actual,
        IS_ANDROID_WEBVIEW: platformMock.IS_ANDROID_WEBVIEW,
        isAndroidNativeRuntime: platformMock.isAndroidNativeRuntime,
    };
});

vi.mock('@/services/nativeStage', async (importOriginal) => {
    const actual = await importOriginal<typeof NativeStageModule>();
    return {
        ...actual,
        ...nativeStageMock,
    };
});

import {
    installFrameTimingDiagnostics,
    readFrameTimingSnapshot,
    resetFrameTimingDiagnostics,
} from '@/utils/frameTimingDiagnostics';
import { useDesktopSettingsStore } from '@/stores/useDesktopSettingsStore';
import { useMinimalistModeStore } from '@/stores/useMinimalistModeStore';
import { useAppViewStore } from '@/stores/useAppViewStore';
import NativeStageBridge from '@/components/visualizer/NativeStageBridge';
import { useMinimalistModeEffects } from '@/components/minimalist/useMinimalistModeEffects';

// test/unit/minimalist/minimalistRound1Fixes.test.ts
// Verifies Round-1 review fixes: idle foreground visibleMs accounting, removal of pointerdown
// wake-ups, and non-destructive suppression of nativeStageEnabled in Minimalist Mode.

const MinimalistEffectsProbe: React.FC<{ onNavigateHome: () => void }> = ({ onNavigateHome }) => {
    const minimalistMode = useMinimalistModeStore(state => state.minimalistMode);
    useMinimalistModeEffects({ minimalistMode, navigateToHome: onNavigateHome });
    return null;
};

describe('minimalist round-1 review fixes', () => {
    beforeEach(() => {
        (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
        resetFrameTimingDiagnostics();
        nativeStageMock.enableNativeStage.mockClear();
        nativeStageMock.disableNativeStage.mockClear();
        useDesktopSettingsStore.setState({ nativeStageEnabled: true });
        useMinimalistModeStore.setState({ minimalistMode: false });
        useAppViewStore.setState({ view: 'home' });
    });

    afterEach(() => {
        resetFrameTimingDiagnostics();
        vi.restoreAllMocks();
    });

    it('accumulates visibleMs across idle rAF gaps and ignores pointerdown motion triggers', () => {
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

        // Expire STARTUP_SAMPLE_WINDOW_MS (5000ms) so the rAF loop stops.
        now = 6500;
        const [id, cb] = [...callbacks.entries()][0];
        callbacks.delete(id);
        cb(now);
        expect(callbacks.size).toBe(0);

        // Advance time while foreground & idle: visibleMs still tracks elapsed foreground time.
        now = 16500;
        expect(readFrameTimingSnapshot().visibleMs).toBe(15500);

        // pointerdown should not wake the rAF sampler, whereas document scroll does.
        document.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        expect(callbacks.size).toBe(0);

        document.dispatchEvent(new Event('scroll', { bubbles: true }));
        expect(callbacks.size).toBe(1);

        visibility = 'hidden';
        now = 17500;
        document.dispatchEvent(new Event('visibilitychange'));
        now = 22500;
        expect(readFrameTimingSnapshot().visibleMs).toBe(16500);
    });

    it('suppresses NativeStage without overwriting persisted nativeStageEnabled and leaves lattice cleanly', async () => {
        const navigateHome = vi.fn();
        useAppViewStore.setState({ view: 'lattice' });

        const container = document.createElement('div');
        const root = createRoot(container);
        await act(async () => {
            root.render(
                React.createElement(
                    React.Fragment,
                    null,
                    React.createElement(NativeStageBridge),
                    React.createElement(MinimalistEffectsProbe, { onNavigateHome: navigateHome }),
                ),
            );
        });
        expect(nativeStageMock.enableNativeStage).toHaveBeenCalledTimes(1);

        await act(async () => {
            useMinimalistModeStore.setState({ minimalistMode: true });
        });
        expect(navigateHome).toHaveBeenCalledTimes(1);
        expect(useDesktopSettingsStore.getState().nativeStageEnabled).toBe(true);
        expect(nativeStageMock.disableNativeStage).toHaveBeenCalled();

        await act(async () => {
            useMinimalistModeStore.setState({ minimalistMode: false });
        });
        expect(nativeStageMock.enableNativeStage).toHaveBeenCalledTimes(2);

        await act(async () => {
            root.unmount();
        });
    });
});
