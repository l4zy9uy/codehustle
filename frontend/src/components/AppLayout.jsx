import React from 'react';
import { MantineProvider, AppShell, Container } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import NavBar from './StudentHome/NavBar';

export default function AppLayout() {
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
          <Container size={1440}>
            <Outlet />
          </Container>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
} 