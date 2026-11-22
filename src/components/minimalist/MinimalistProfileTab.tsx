import React from 'react';
import { Activity, Check, LogIn, LogOut, Settings, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LibraryAccountController } from '../../library/core/account/account.contract';
import { canLogoutProvider, resolveProviderSelectLabel } from '../../library/core/account/accountRules';
import { useLibraryAccountProviders, useLibraryAccountSelector } from '../../library/core/account/useLibraryAccount';
import { translateHomeMessage } from '../../library/core/home/homeSources';
import { providerDisplayName } from '../../i18n/providerName';
import { useMinimalistModeStore } from '../../stores/useMinimalistModeStore';
import { openSettings } from '../../stores/useSettingsModalStore';
import { openLoginWindow } from '../login/loginWindowStore';
import { openPerfCheck } from '../perfCheck/openPerfCheck';
import { IS_ANDROID_WEBVIEW } from '../../utils/platform';
import type { MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/MinimalistProfileTab.tsx
// Standard "Me / Profile" tab exposing online platform accounts, Navidrome/Settings links, diagnostics, and exiting Minimalist Mode.

type MinimalistProfileTabProps = {
    account: LibraryAccountController;
    navidromeEnabled: boolean;
    palette: MinimalistThemePalette;
};

const MinimalistProfileTab: React.FC<MinimalistProfileTabProps> = ({
    account,
    navidromeEnabled,
    palette,
}) => {
    const { t } = useTranslation();
    const { providers, activeProviderId } = useLibraryAccountProviders(account);
    const logout = useLibraryAccountSelector(account, snapshot => snapshot.logout);
    const isDesktop = typeof window !== 'undefined' && Boolean(window.electron);

    return (
        <div className="h-full overflow-y-auto px-4 py-4 space-y-5">
            <section
                className="rounded-2xl border p-4 flex items-center justify-between gap-3"
                style={{ backgroundColor: palette.surfaceBg, borderColor: palette.borderColor }}
            >
                <div className="min-w-0">
                    <div className="text-sm font-semibold flex items-center gap-1.5" style={{ color: palette.textPrimary }}>
                        <Sparkles size={16} style={{ color: palette.accentColor }} />
                        <span>{t('minimalist.profile.modeCardTitle')}</span>
                    </div>
                    <div className="text-xs mt-1 leading-relaxed" style={{ color: palette.textSecondary }}>
                        {t('minimalist.profile.modeCardDesc')}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => useMinimalistModeStore.getState().handleToggleMinimalistMode(false)}
                    className="shrink-0 rounded-xl px-3.5 py-2 text-xs font-medium"
                    style={{ backgroundColor: palette.accentColor, color: '#ffffff' }}
                >
                    {t('minimalist.exitToFull')}
                </button>
            </section>

            <section className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: palette.textSecondary }}>
                    {t('minimalist.profile.accountsSection')}
                </h2>
                <div className="rounded-2xl border divide-y overflow-hidden" style={{ backgroundColor: palette.surfaceBg, borderColor: palette.borderColor }}>
                    {providers.map(provider => {
                        const isActive = provider.providerId === activeProviderId;
                        const configured = provider.availability.configured;
                        const showLogout = isActive && canLogoutProvider(provider);
                        const actionLabel = translateHomeMessage(t, resolveProviderSelectLabel(provider));
                        const userStatus = !configured
                            ? t('home.providerNotConfigured', 'Not configured')
                            : provider.requiresAccount === false
                                ? t('home.providerNoAccount', 'No sign-in needed')
                                : provider.user?.nickname || t('home.guestTitle', 'Not signed in');

                        return (
                            <div
                                key={provider.providerId}
                                className="flex items-center justify-between gap-3 px-4 py-3"
                                style={{ borderColor: palette.borderColor }}
                            >
                                <div className="min-w-0">
                                    <div className="text-sm font-medium flex items-center gap-1.5" style={{ color: palette.textPrimary }}>
                                        <span>{providerDisplayName(t, provider)}</span>
                                        {isActive && <Check size={14} style={{ color: palette.accentColor }} />}
                                    </div>
                                    <div className="text-xs truncate" style={{ color: palette.textSecondary }}>
                                        {userStatus}
                                    </div>
                                </div>
                                <div className="shrink-0 flex items-center gap-1.5">
                                    {configured && !isActive && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                void account.selectProvider(provider.providerId).then(result => {
                                                    if (result.action === 'login') openLoginWindow(result.providerId);
                                                });
                                            }}
                                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium"
                                            style={{ backgroundColor: palette.mutedBg, color: palette.textPrimary }}
                                        >
                                            {actionLabel}
                                        </button>
                                    )}
                                    {configured && isActive && provider.requiresAccount !== false && !provider.user && (
                                        <button
                                            type="button"
                                            onClick={() => openLoginWindow(provider.providerId)}
                                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                                            style={{ backgroundColor: palette.accentColor, color: '#ffffff' }}
                                        >
                                            <LogIn size={13} />
                                            <span>{actionLabel}</span>
                                        </button>
                                    )}
                                    {showLogout && (
                                        <button
                                            type="button"
                                            aria-label={t('account.logout', 'Log out')}
                                            disabled={logout.status === 'pending'}
                                            onClick={() => { void account.logout(provider.providerId); }}
                                            className="p-2 rounded-lg disabled:opacity-40"
                                            style={{ backgroundColor: palette.mutedBg, color: palette.textSecondary }}
                                        >
                                            <LogOut size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: palette.textSecondary }}>
                    {t('minimalist.profile.settingsSection')}
                </h2>
                <div className="rounded-2xl border divide-y overflow-hidden" style={{ backgroundColor: palette.surfaceBg, borderColor: palette.borderColor }}>
                    <button
                        type="button"
                        onClick={() => openSettings('options', 'general')}
                        className="w-full flex items-center justify-between px-4 py-3 text-left"
                        style={{ borderColor: palette.borderColor }}
                    >
                        <div className="flex items-center gap-2.5 text-sm font-medium" style={{ color: palette.textPrimary }}>
                            <Settings size={16} style={{ color: palette.textSecondary }} />
                            <span>{t('minimalist.profile.allSettings')}</span>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => openSettings('options', 'integration')}
                        className="w-full flex items-center justify-between px-4 py-3 text-left"
                        style={{ borderColor: palette.borderColor }}
                    >
                        <div className="flex items-center gap-2.5 text-sm font-medium" style={{ color: palette.textPrimary }}>
                            <SlidersHorizontal size={16} style={{ color: palette.textSecondary }} />
                            <span>{t('minimalist.profile.navidromeIntegration')}</span>
                        </div>
                        <span className="text-xs" style={{ color: palette.textSecondary }}>
                            {navidromeEnabled ? t('minimalist.profile.enabled') : t('minimalist.profile.disabled')}
                        </span>
                    </button>
                    {(isDesktop || IS_ANDROID_WEBVIEW) && (
                        <button
                            type="button"
                            onClick={() => openPerfCheck()}
                            className="w-full flex items-center justify-between px-4 py-3 text-left"
                            style={{ borderColor: palette.borderColor }}
                        >
                            <div className="flex items-center gap-2.5 text-sm font-medium" style={{ color: palette.textPrimary }}>
                                <Activity size={16} style={{ color: palette.textSecondary }} />
                                <span>{t('options.perfCheck', 'Performance Check')}</span>
                            </div>
                        </button>
                    )}
                </div>
            </section>
        </div>
    );
};

export default MinimalistProfileTab;
