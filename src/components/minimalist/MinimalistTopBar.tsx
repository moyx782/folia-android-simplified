import React from 'react';
import { Command, Moon, Settings, Sparkles, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMinimalistModeStore } from '../../stores/useMinimalistModeStore';
import { openSettings } from '../../stores/useSettingsModalStore';
import type { MinimalistTab, MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/MinimalistTopBar.tsx
// Lightweight static header bar for Minimalist Mode tabs with quick Command Palette, Daylight, Settings, and Exit buttons.

type MinimalistTopBarProps = {
    activeTab: MinimalistTab;
    palette: MinimalistThemePalette;
    onOpenCommandPalette: () => void;
    onToggleDaylight: () => void;
};

const TAB_TITLE_KEYS: Record<MinimalistTab, string> = {
    discover: 'minimalist.tabs.discover',
    library: 'minimalist.tabs.library',
    search: 'minimalist.tabs.search',
    profile: 'minimalist.tabs.profile',
};

const MinimalistTopBar: React.FC<MinimalistTopBarProps> = ({
    activeTab,
    palette,
    onOpenCommandPalette,
    onToggleDaylight,
}) => {
    const { t } = useTranslation();

    return (
        <header
            className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b"
            style={{
                backgroundColor: palette.surfaceBg,
                borderColor: palette.borderColor,
                paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px), var(--window-buttons-drop, 0px))',
            }}
        >
            <div className="min-w-0 flex items-center gap-2">
                <h1 className="text-base font-semibold tracking-tight truncate" style={{ color: palette.textPrimary }}>
                    {t(TAB_TITLE_KEYS[activeTab])}
                </h1>
                <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ backgroundColor: palette.mutedBg, color: palette.textSecondary }}
                >
                    {t('minimalist.badge')}
                </span>
            </div>
            <div className="shrink-0 flex items-center gap-1.5">
                <button
                    type="button"
                    aria-label={t('minimalist.commandPaletteLabel')}
                    onClick={onOpenCommandPalette}
                    className="p-2 rounded-lg"
                    style={{ color: palette.textSecondary, backgroundColor: palette.mutedBg }}
                >
                    <Command size={16} />
                </button>
                <button
                    type="button"
                    aria-label={t('options.daylightMode')}
                    onClick={onToggleDaylight}
                    className="p-2 rounded-lg"
                    style={{ color: palette.textSecondary, backgroundColor: palette.mutedBg }}
                >
                    {palette.isDaylight ? <Moon size={16} /> : <Sun size={16} />}
                </button>
                <button
                    type="button"
                    aria-label={t('options.settingsWindowName')}
                    onClick={() => openSettings('options', 'graphics')}
                    className="p-2 rounded-lg"
                    style={{ color: palette.textSecondary, backgroundColor: palette.mutedBg }}
                >
                    <Settings size={16} />
                </button>
                <button
                    type="button"
                    aria-label={t('minimalist.exitToFull')}
                    onClick={() => useMinimalistModeStore.getState().handleToggleMinimalistMode(false)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                    style={{ backgroundColor: palette.mutedBg, color: palette.accentColor }}
                >
                    <Sparkles size={14} />
                    <span className="hidden sm:inline">{t('minimalist.exitToFullShort')}</span>
                </button>
            </div>
        </header>
    );
};

export default MinimalistTopBar;
