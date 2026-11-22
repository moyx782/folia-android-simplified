import { create } from 'zustand';
import i18n from '../i18n/config';
import { getStoredBoolean, setStoredBoolean } from './storagePrimitives';
import { setStatusMessage } from './useStatusMessageStore';

// src/stores/useMinimalistModeStore.ts
// Minimalist Mode ("极简模式") state and `<html data-minimalist-mode>` root attribute sync.
// Intentionally separated from `useThemeSettingsStore` and `visualConfigTransfer` because it
// switches the application shell and background runtime policy rather than OBS visual presets.

const MINIMALIST_MODE_STORAGE_KEY = 'folia_minimalist_mode';
export const MINIMALIST_MODE_ATTRIBUTE = 'data-minimalist-mode';

export const applyMinimalistModeAttribute = (enabled: boolean): void => {
    if (typeof document === 'undefined') return;
    if (enabled) {
        document.documentElement.setAttribute(MINIMALIST_MODE_ATTRIBUTE, 'true');
        return;
    }
    document.documentElement.removeAttribute(MINIMALIST_MODE_ATTRIBUTE);
};

interface MinimalistModeState {
    minimalistMode: boolean;
    setMinimalistMode: (enabled: boolean) => void;
    handleToggleMinimalistMode: (enabled: boolean, options?: { silent?: boolean }) => void;
    toggleMinimalistMode: () => void;
}

const initialEnabled = getStoredBoolean(MINIMALIST_MODE_STORAGE_KEY, false);
applyMinimalistModeAttribute(initialEnabled);

export const useMinimalistModeStore = create<MinimalistModeState>((set, get) => ({
    minimalistMode: initialEnabled,

    setMinimalistMode: (enabled) => {
        setStoredBoolean(MINIMALIST_MODE_STORAGE_KEY, enabled);
        applyMinimalistModeAttribute(enabled);
        set({ minimalistMode: enabled });
    },

    handleToggleMinimalistMode: (enabled, options) => {
        const previous = get().minimalistMode;
        get().setMinimalistMode(enabled);
        if (!options?.silent && previous !== enabled) {
            setStatusMessage({
                type: 'info',
                text: i18n.t(enabled ? 'notifications.minimalistModeOn' : 'notifications.minimalistModeOff'),
            });
        }
    },

    toggleMinimalistMode: () => {
        get().handleToggleMinimalistMode(!get().minimalistMode);
    },
}));
