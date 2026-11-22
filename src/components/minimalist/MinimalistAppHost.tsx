import React, { Suspense, lazy } from 'react';
import DevDebugOverlay from '../DevDebugOverlay';
import MemoryMonitorWindow from '../debug/MemoryMonitorWindow';
import HifiSignalPathPanel from '../hifi/HifiSignalPathPanel';
import UpdateDialog from '../appUpdate/UpdateDialog';
import PerfCheckOverlay from '../perfCheck/PerfCheckOverlay';
import type { MinimalistWorkspaceProps } from './minimalistTypes';

// src/components/minimalist/MinimalistAppHost.tsx
// Host wrapper for Minimalist Mode mounting the lazy workspace alongside essential overlays
// (HiFi signal path / PipeWire probe, updates, performance check, and optional debug panes).

const MinimalistWorkspace = lazy(() => import('./MinimalistWorkspace'));

type MinimalistAppHostProps = {
    workspace: MinimalistWorkspaceProps;
    debugOverlay?: React.ComponentProps<typeof DevDebugOverlay> | null;
    memoryMonitor?: React.ComponentProps<typeof MemoryMonitorWindow> | null;
};

const MinimalistAppHost: React.FC<MinimalistAppHostProps> = ({
    workspace,
    debugOverlay,
    memoryMonitor,
}) => (
    <>
        <Suspense fallback={null}>
            <MinimalistWorkspace {...workspace} />
        </Suspense>
        <HifiSignalPathPanel />
        {debugOverlay && <DevDebugOverlay {...debugOverlay} />}
        {memoryMonitor && <MemoryMonitorWindow {...memoryMonitor} />}
        <UpdateDialog />
        <PerfCheckOverlay />
    </>
);

export default MinimalistAppHost;
