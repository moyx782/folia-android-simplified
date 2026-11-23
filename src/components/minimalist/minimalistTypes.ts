import type { Album, Artist, LyricData, PlayerState, SongResult, Theme, UnifiedSong } from '../../types';
import type { MediaId, OmniCollection } from '../../types/onlineMusic';
import type { SearchKind, SearchSource } from '../../stores/useSearchNavigationStore';
import type { AppView } from '../../stores/useAppViewStore';
import type { HomeViewModel } from '../app/home/buildHomeModel';
import { adjustLightnessForContrast, getContrastRatio } from '../../utils/themeColorMath';

// src/components/minimalist/minimalistTypes.ts
// Shared view types and surface prop contracts for the Minimalist Mode ("极简模式") workspace.

export type MinimalistTab = 'discover' | 'library' | 'search' | 'profile';

export type MinimalistPlayingSongLinks = {
    openLocalArtist: (entityId?: string) => void;
    openLocalAlbum: () => void;
    openNavidromeArtist: () => void;
    openNavidromeAlbum: () => void;
    openOnlineArtist: (song: SongResult, artist: Artist) => void;
    openOnlineAlbum: (song: SongResult, album: Album) => void;
};

export type MinimalistThemePalette = {
    isDaylight: boolean;
    accentColor: string;
    onAccentColor: string;
    pageBg: string;
    surfaceBg: string;
    elevatedBg: string;
    borderColor: string;
    textPrimary: string;
    textSecondary: string;
    mutedBg: string;
};

export const resolveOnAccentColor = (accentColor: string): string => (
    getContrastRatio('#ffffff', accentColor) >= getContrastRatio('#000000', accentColor) ? '#ffffff' : '#000000'
);

export const createMinimalistPalette = (isDaylight: boolean, theme: Theme): MinimalistThemePalette => {
    const rawAccent = theme.accentColor || (isDaylight ? '#2563eb' : '#60a5fa');
    const surfaceBg = isDaylight ? '#ffffff' : '#13151b';
    const accentColor = adjustLightnessForContrast(rawAccent, surfaceBg, 3.5);
    const onAccentColor = resolveOnAccentColor(accentColor);
    if (isDaylight) {
        return {
            isDaylight: true,
            accentColor,
            onAccentColor,
            pageBg: '#f6f7f9',
            surfaceBg,
            elevatedBg: '#ffffff',
            borderColor: 'rgba(15, 23, 42, 0.08)',
            textPrimary: '#111827',
            textSecondary: '#6b7280',
            mutedBg: 'rgba(15, 23, 42, 0.05)',
        };
    }
    return {
        isDaylight: false,
        accentColor,
        onAccentColor,
        pageBg: '#0b0c10',
        surfaceBg,
        elevatedBg: '#1a1d26',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        textPrimary: '#f4f4f5',
        textSecondary: '#a1a1aa',
        mutedBg: 'rgba(255, 255, 255, 0.06)',
    };
};

export type MinimalistWorkspaceProps = {
    homeModel: HomeViewModel;
    currentView: AppView;
    navigateBackFromPlayer: () => void;
    navigateToPlayer: () => void;
    theme: Theme;
    isDaylight: boolean;
    toggleDaylightMode: () => void;
    currentSong: SongResult | null;
    playQueue: SongResult[];
    playerState: PlayerState;
    duration: number;
    effectiveLoopMode: 'off' | 'all' | 'one';
    lyrics: LyricData | null;
    currentLineIndex: number;
    isLiked: boolean;
    canTogglePlayback: boolean;
    isControlDisabled: boolean;
    togglePlay: () => void;
    toggleLoop: () => void;
    onPrevTrack: () => void;
    onNextTrack: () => void;
    shuffleQueue: () => void;
    onLike: () => void;
    onSeek: (timeSec: number) => void;
    onSeekLyricLine: (lyricTimeSec: number) => void;
    playingSongLinks: MinimalistPlayingSongLinks;
    playSong: (song: SongResult, queue?: SongResult[]) => void;
    removeQueueSong: (index: number) => void;
    moveQueueSongToNext: (index: number) => void;
    openLyricMatch: () => void;
    openCommandPalette: () => void;
    onSubmitSearch: (source?: SearchSource, kind?: SearchKind) => void;
    onLoadMoreSearch: () => void;
    onPlaySearchResult: (track: UnifiedSong) => void;
    onAddSearchResultToQueue: (track: UnifiedSong) => void;
    onOpenSearchArtist: (track: UnifiedSong, artistName: string, artistId?: MediaId, entityId?: string) => void;
    onOpenSearchAlbum: (track: UnifiedSong, albumName: string, albumId?: MediaId, entityId?: string) => void;
    onOpenSearchCollection: (collection: OmniCollection) => void;
    resolveSearchResultDisplay?: (track: UnifiedSong) => UnifiedSong;
    hasLocalSongs: boolean;
};
