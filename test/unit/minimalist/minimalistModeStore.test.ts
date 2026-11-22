// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
    MINIMALIST_MODE_ATTRIBUTE,
    applyMinimalistModeAttribute,
    useMinimalistModeStore,
} from '@/stores/useMinimalistModeStore';
import { useStatusMessageStore } from '@/stores/useStatusMessageStore';

// test/unit/minimalist/minimalistModeStore.test.ts
// Verifies persistence, `<html data-minimalist-mode>` synchronization, and toast notifications for Minimalist Mode.

describe('useMinimalistModeStore', () => {
    beforeEach(() => {
        localStorage.clear();
        useMinimalistModeStore.setState({ minimalistMode: false });
        applyMinimalistModeAttribute(false);
        useStatusMessageStore.setState({ message: null, held: false });
    });

    it('persists minimalist mode and toggles root document attribute', () => {
        useMinimalistModeStore.getState().setMinimalistMode(true);

        expect(useMinimalistModeStore.getState().minimalistMode).toBe(true);
        expect(localStorage.getItem('folia_minimalist_mode')).toBe('true');
        expect(document.documentElement.getAttribute(MINIMALIST_MODE_ATTRIBUTE)).toBe('true');

        useMinimalistModeStore.getState().setMinimalistMode(false);

        expect(useMinimalistModeStore.getState().minimalistMode).toBe(false);
        expect(localStorage.getItem('folia_minimalist_mode')).toBe('false');
        expect(document.documentElement.hasAttribute(MINIMALIST_MODE_ATTRIBUTE)).toBe(false);
    });

    it('emits a status notification on toggle unless silent', () => {
        useMinimalistModeStore.getState().handleToggleMinimalistMode(true, { silent: true });
        expect(useStatusMessageStore.getState().message).toBeNull();

        useMinimalistModeStore.getState().handleToggleMinimalistMode(false);
        expect(useStatusMessageStore.getState().message).not.toBeNull();

        useMinimalistModeStore.getState().toggleMinimalistMode();
        expect(useMinimalistModeStore.getState().minimalistMode).toBe(true);
    });
});
