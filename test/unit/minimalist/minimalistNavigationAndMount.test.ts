import { describe, expect, it } from 'vitest';
import { shouldMountPlayerVisualizer } from '@/components/app/presentation/playerVisualizerMount';
import {
    isStartupLatticeDeferred,
    resolvePlayerCapsuleNavigationTarget,
    resolveStartupView,
} from '@/hooks/useAppNavigation';
import { resolveStartupExperienceStep } from '@/hooks/useStartupExperienceGate';

// test/unit/minimalist/minimalistNavigationAndMount.test.ts
// Ensures Minimalist Mode suppresses canvas visualizers, lattice navigation, and complex UI onboarding prompts.

describe('minimalist navigation and visualizer mounting', () => {
    it('unmounts player visualizer whenever minimalist mode is enabled', () => {
        const base = {
            currentView: 'player',
            hasLatticeExited: true,
            shouldRevealHomeSurface: false,
            libraryOccludesPlayer: false,
            hasLibraryOcclusionSettled: false,
            handoffKeepsVisualizer: true,
        };

        expect(shouldMountPlayerVisualizer({ ...base, minimalistMode: false })).toBe(true);
        expect(shouldMountPlayerVisualizer({ ...base, minimalistMode: true })).toBe(false);
    });

    it('routes startup and player capsule directly to player instead of lattice in minimalist mode', () => {
        expect(resolvePlayerCapsuleNavigationTarget('home', 'lattice', true)).toBe('player');
        expect(resolvePlayerCapsuleNavigationTarget('player', 'lattice', true)).toBeNull();
        expect(resolveStartupView({
            openPlayerOnLaunch: true,
            playbackEntryView: 'lattice',
            queueLength: 4,
            minimalistMode: true,
        })).toBe('player');
        expect(isStartupLatticeDeferred({
            openPlayerOnLaunch: true,
            playbackEntryView: 'lattice',
            minimalistMode: true,
        })).toBe(false);
    });

    it('skips library-suite and ponder onboarding steps while preserving release notes', () => {
        const base = {
            isCurrentRelease: true,
            hasSeenPonder: false,
            hasFinishedThisRelease: false,
            hasSeenReleaseNotes: false,
            isReleaseNotesOpen: false,
            hasChosenPlaybackEntryView: false,
            needsLibrarySuitePrompt: true,
            isPlaybackEntryViewPromptOpen: false,
            isPonderOnboardingOpen: false,
            minimalistMode: true,
        };

        expect(resolveStartupExperienceStep(base)).toBe('release-notes');
        expect(resolveStartupExperienceStep({ ...base, hasSeenReleaseNotes: true })).toBeNull();
    });
});
