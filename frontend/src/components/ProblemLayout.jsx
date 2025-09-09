import React from 'react';
import { AppShell } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import NavBar from './StudentHome/NavBar';

export default function ProblemLayout() {
  return (
    <AppShell header={{ height: 48 }} padding="xs">
      <NavBar />
      <AppShell.Main>
        {/* Full-bleed main content (no Container) */}
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
