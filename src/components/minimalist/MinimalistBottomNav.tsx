import React from 'react';
import { Compass, Library, Search, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MinimalistTab, MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/MinimalistBottomNav.tsx
// Standard four-tab mobile/desktop navigation dock for Minimalist Mode.

type MinimalistBottomNavProps = {
    activeTab: MinimalistTab;
    palette: MinimalistThemePalette;
    onSelectTab: (tab: MinimalistTab) => void;
};

const TABS: Array<{ id: MinimalistTab; labelKey: string; Icon: React.ComponentType<{ size?: number }> }> = [
    { id: 'discover', labelKey: 'minimalist.tabs.discover', Icon: Compass },
    { id: 'library', labelKey: 'minimalist.tabs.library', Icon: Library },
    { id: 'search', labelKey: 'minimalist.tabs.search', Icon: Search },
    { id: 'profile', labelKey: 'minimalist.tabs.profile', Icon: User },
];

const MinimalistBottomNav: React.FC<MinimalistBottomNavProps> = ({ activeTab, palette, onSelectTab }) => {
    const { t } = useTranslation();

    return (
        <nav
            aria-label={t('minimalist.navAriaLabel')}
            className="shrink-0 grid grid-cols-4 border-t"
            style={{
                backgroundColor: palette.surfaceBg,
                borderColor: palette.borderColor,
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            {TABS.map(({ id, labelKey, Icon }) => {
                const active = id === activeTab;
                return (
                    <button
                        key={id}
                        type="button"
                        aria-current={active ? 'page' : undefined}
                        onClick={() => onSelectTab(id)}
                        className="flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium"
                        style={{ color: active ? palette.accentColor : palette.textSecondary }}
                    >
                        <Icon size={18} />
                        <span>{t(labelKey)}</span>
                    </button>
                );
            })}
        </nav>
    );
};

export default MinimalistBottomNav;
