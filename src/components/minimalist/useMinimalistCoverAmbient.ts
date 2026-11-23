import { useEffect, useMemo, useState } from 'react';
import { extractRepresentativeColors } from '../../utils/colorExtractor';
import { getSizedCoverUrl } from '../../utils/coverUrl';
import { fitOklchToSrgb, oklabToSrgb, oklchToOklab, srgbToOklch } from '../../utils/oklab';
import { adjustLightnessForContrast, parseThemeColor, rgbToHex } from '../../utils/themeColorMath';
import { colorWithAlpha, mixColors } from '../visualizer/colorMix';
import { resolveOnAccentColor, type MinimalistThemePalette } from './minimalistTypes';

// src/components/minimalist/useMinimalistCoverAmbient.ts
// Static cover-extracted gradient backdrop, WCAG-safe accent tuning, & responsive split-layout detection.

const COVER_COLOR_CACHE = new Map<string, [string, string]>();
const COVER_COLOR_CACHE_LIMIT = 64;
const WIDE_MEDIA_QUERY = '(min-width: 768px) and (min-height: 500px)';

const readCachedPair = (url: string): [string, string] | null => {
    const hit = COVER_COLOR_CACHE.get(url);
    if (!hit) return null;
    COVER_COLOR_CACHE.delete(url);
    COVER_COLOR_CACHE.set(url, hit);
    return hit;
};

const writeCachedPair = (url: string, pair: [string, string]): void => {
    COVER_COLOR_CACHE.delete(url);
    COVER_COLOR_CACHE.set(url, pair);
    if (COVER_COLOR_CACHE.size > COVER_COLOR_CACHE_LIMIT) {
        const oldest = COVER_COLOR_CACHE.keys().next().value;
        if (oldest !== undefined) COVER_COLOR_CACHE.delete(oldest);
    }
};

const getWideMatcher = (): MediaQueryList | null => {
    try { return typeof window !== 'undefined' ? window.matchMedia(WIDE_MEDIA_QUERY) : null; } catch { return null; }
};

export const useIsWidePlayerLayout = (): boolean => {
    const [isWide, setIsWide] = useState(() => getWideMatcher()?.matches ?? false);

    useEffect(() => {
        const matcher = getWideMatcher();
        if (!matcher) return undefined;
        const sync = () => setIsWide(matcher.matches);
        sync();
        matcher.addEventListener('change', sync);
        return () => matcher.removeEventListener('change', sync);
    }, []);

    return isWide;
};

const clampBackdropSwatch = (rawHex: string, fallbackHex: string, isDaylight: boolean): string => {
    const parsed = parseThemeColor(rawHex) ?? parseThemeColor(fallbackHex);
    if (!parsed) return fallbackHex;
    const oklch = srgbToOklch(parsed);
    const seed = oklch.C < 0.025 ? srgbToOklch(parseThemeColor(fallbackHex) ?? parsed) : oklch;
    const clamped = fitOklchToSrgb({
        L: isDaylight ? Math.max(0.66, Math.min(0.86, seed.L)) : Math.max(0.28, Math.min(0.54, seed.L)),
        C: Math.min(seed.C, isDaylight ? 0.12 : 0.15),
        h: seed.h,
    });
    return rgbToHex(oklabToSrgb(oklchToOklab(clamped)));
};

export const resolveMinimalistCoverAmbient = (
    basePalette: MinimalistThemePalette,
    primaryRaw: string,
    secondaryRaw: string,
): { backgroundImage: string; palette: MinimalistThemePalette; onAccentColor: string } => {
    const primary = clampBackdropSwatch(primaryRaw, basePalette.accentColor, basePalette.isDaylight);
    const secondary = clampBackdropSwatch(secondaryRaw, primary, basePalette.isDaylight);
    const topTint = basePalette.isDaylight ? mixColors('#f5f6fa', primary, 0.22) : mixColors('#0b0d13', primary, 0.24);
    const bottomTint = basePalette.isDaylight ? mixColors('#eef1f7', secondary, 0.16) : mixColors('#08090e', secondary, 0.18);

    const parsedPrimary = parseThemeColor(primaryRaw);
    const rawAccentSeed = parsedPrimary && srgbToOklch(parsedPrimary).C >= 0.03 ? primaryRaw : basePalette.accentColor;
    const rawOklch = srgbToOklch(parseThemeColor(rawAccentSeed) ?? { r: 37, g: 99, b: 235 });
    const tunedHex = rgbToHex(oklabToSrgb(oklchToOklab(fitOklchToSrgb({
        L: basePalette.isDaylight ? Math.min(0.52, Math.max(0.36, rawOklch.L)) : Math.max(0.56, Math.min(0.74, rawOklch.L)),
        C: Math.min(0.2, Math.max(0.08, rawOklch.C)),
        h: rawOklch.h,
    }))));
    const accentColor = adjustLightnessForContrast(tunedHex, topTint, 4.0);
    const onAccentColor = resolveOnAccentColor(accentColor);

    return {
        backgroundImage: [
            `radial-gradient(circle at 18% 18%, ${colorWithAlpha(primary, basePalette.isDaylight ? 0.2 : 0.26)} 0%, transparent 56%)`,
            `radial-gradient(circle at 84% 78%, ${colorWithAlpha(secondary, basePalette.isDaylight ? 0.15 : 0.2)} 0%, transparent 54%)`,
            `linear-gradient(160deg, ${topTint} 0%, ${bottomTint} 100%)`,
        ].join(', '),
        onAccentColor,
        palette: basePalette.isDaylight
            ? { ...basePalette, accentColor, onAccentColor, pageBg: topTint, surfaceBg: 'rgba(255, 255, 255, 0.78)', elevatedBg: '#ffffff', borderColor: 'rgba(15, 23, 42, 0.1)', textPrimary: '#0f172a', textSecondary: 'rgba(15, 23, 42, 0.68)', mutedBg: 'rgba(15, 23, 42, 0.08)' }
            : { ...basePalette, accentColor, onAccentColor, pageBg: topTint, surfaceBg: 'rgba(255, 255, 255, 0.09)', elevatedBg: '#181b24', borderColor: 'rgba(255, 255, 255, 0.14)', textPrimary: '#f8fafc', textSecondary: 'rgba(241, 245, 249, 0.74)', mutedBg: 'rgba(255, 255, 255, 0.1)' },
    };
};

export const useMinimalistCoverAmbient = (
    isOpen: boolean,
    rawCoverUrl: string,
    basePalette: MinimalistThemePalette,
): { backgroundImage: string; palette: MinimalistThemePalette; onAccentColor: string } => {
    const sampleUrl = rawCoverUrl ? getSizedCoverUrl(rawCoverUrl, 128) : '';
    const [extracted, setExtracted] = useState<{ url: string; colors: [string, string] } | null>(null);

    useEffect(() => {
        if (!isOpen || !sampleUrl || readCachedPair(sampleUrl)) return undefined;
        let cancelled = false;
        void extractRepresentativeColors(sampleUrl, 2)
            .then(colors => {
                if (cancelled || colors.length === 0) return;
                const pair: [string, string] = [colors[0], colors[1] ?? colors[0]];
                writeCachedPair(sampleUrl, pair);
                setExtracted({ url: sampleUrl, colors: pair });
            })
            .catch(() => undefined);
        return () => { cancelled = true; };
    }, [isOpen, sampleUrl]);

    const pair = sampleUrl
        ? (readCachedPair(sampleUrl) ?? (extracted?.url === sampleUrl ? extracted.colors : null))
        : null;

    return useMemo(() => (
        pair
            ? resolveMinimalistCoverAmbient(basePalette, pair[0], pair[1])
            : { backgroundImage: 'none', palette: basePalette, onAccentColor: basePalette.onAccentColor }
    ), [basePalette, pair]);
};
