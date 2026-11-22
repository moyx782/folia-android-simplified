import { useEffect } from 'react';
import { useAppViewStore } from '../../stores/useAppViewStore';

// src/components/minimalist/useMinimalistModeEffects.ts
// Leaves the Lattice 3D surface when Minimalist Mode turns on without mutating user settings
// or introducing inter-store imports inside `src/stores/`.

type UseMinimalistModeEffectsParams = {
    minimalistMode: boolean;
    navigateToHome: () => void;
};

export const useMinimalistModeEffects = ({ minimalistMode, navigateToHome }: UseMinimalistModeEffectsParams): void => {
    const currentView = useAppViewStore(state => state.view);

    useEffect(() => {
        if (!minimalistMode) return;
        const { isPanelOpen, setIsPanelOpen } = useAppViewStore.getState();
        if (isPanelOpen) {
            setIsPanelOpen(false);
        }
        if (currentView === 'lattice') {
            navigateToHome();
        }
    }, [currentView, minimalistMode, navigateToHome]);
};
