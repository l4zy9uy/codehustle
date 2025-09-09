import React from 'react';
import { AppShell } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import NavBar from './StudentHome/NavBar';

export default function ProblemLayout() {
  return (
    <AppShell header={{ height: 56 }} padding="xs">
      <NavBar />
      {/* SingleProblem: no page scrollbar; internal panes handle their own scroll */}
      <AppShell.Main style={{ overflow: 'hidden', height: 'calc(100vh - 56px)' }}>
        {/* Full-bleed main content (no Container) */}
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
