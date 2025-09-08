import React from 'react';
import { MantineProvider, AppShell } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import NavBar from './StudentHome/NavBar';

export default function ProblemLayout() {
  return (
    <MantineProvider
      theme={{
        defaultRadius: 'sm',
        components: {
          Button: { defaultProps: { radius: 'xl', size: 'xs' } },
          TextInput: { defaultProps: { radius: 'xl' } },
          MultiSelect: { defaultProps: { radius: 'xl' } },
          Badge: { defaultProps: { radius: 'xl' } },
          Paper: { defaultProps: { radius: 'sm' } },
        },
      }}
    >
      <AppShell header={{ height: 48 }} padding="xs">
        <NavBar />
        <AppShell.Main>
          {/* Full-bleed main content (no Container) */}
          <Outlet />
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}

