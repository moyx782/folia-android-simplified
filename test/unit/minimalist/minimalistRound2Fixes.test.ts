// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppViewStore } from '@/stores/useAppViewStore';
import { useMinimalistModeStore } from '@/stores/useMinimalistModeStore';
import { useMinimalistModeEffects } from '@/components/minimalist/useMinimalistModeEffects';
import MinimalistSeekBar from '@/components/minimalist/MinimalistSeekBar';
import { createMinimalistPalette } from '@/components/minimalist/minimalistTypes';

// test/unit/minimalist/minimalistRound2Fixes.test.ts
// Verifies Round-2 fixes: MinimalistSeekBar keyboard Tab focus non-seeking, Arrow key seeking,
// and clearing isPanelOpen when switching into Minimalist Mode.

const EffectsProbe: React.FC<{ onNavigateHome: () => void }> = ({ onNavigateHome }) => {
    const minimalistMode = useMinimalistModeStore(state => state.minimalistMode);
    useMinimalistModeEffects({ minimalistMode, navigateToHome: onNavigateHome });
    return null;
};

describe('minimalist round-2 review fixes', () => {
    beforeEach(() => {
        (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
        useAppViewStore.setState({ view: 'player', isPanelOpen: true });
        useMinimalistModeStore.setState({ minimalistMode: false });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('clears unmounted player panel state when Minimalist Mode turns on', async () => {
        const navigateHome = vi.fn();
        const container = document.createElement('div');
        const root = createRoot(container);
        await act(async () => {
            root.render(React.createElement(EffectsProbe, { onNavigateHome: navigateHome }));
        });
        expect(useAppViewStore.getState().isPanelOpen).toBe(true);

        await act(async () => {
            useMinimalistModeStore.setState({ minimalistMode: true });
        });
        expect(useAppViewStore.getState().isPanelOpen).toBe(false);

        await act(async () => {
            root.unmount();
        });
    });

    it('commits SeekBar seek on ArrowRight keyup but ignores Tab focus navigation keyup', async () => {
        const onSeek = vi.fn();
        const palette = createMinimalistPalette(false, { accentColor: '#2563eb' } as never);
        const container = document.createElement('div');
        const root = createRoot(container);

        await act(async () => {
            root.render(
                React.createElement(MinimalistSeekBar, {
                    duration: 180,
                    disabled: false,
                    palette,
                    onSeek,
                }),
            );
        });

        const slider = container.querySelector('input[type="range"]');
        expect(slider).not.toBeNull();
        if (!(slider instanceof HTMLInputElement)) return;

        slider.value = '42';
        await act(async () => {
            slider.dispatchEvent(new KeyboardEvent('keyup', { key: 'Tab', bubbles: true }));
        });
        expect(onSeek).not.toHaveBeenCalled();

        await act(async () => {
            slider.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }));
        });
        expect(onSeek).toHaveBeenCalledTimes(1);
        expect(onSeek).toHaveBeenCalledWith(42);

        await act(async () => {
            root.unmount();
        });
    });
});
