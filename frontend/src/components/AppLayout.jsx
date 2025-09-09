import React from 'react';
import { AppShell, Container } from '@mantine/core';
// Theme is provided at root MantineProvider in main.jsx
import { Outlet } from 'react-router-dom';
import NavBar from './StudentHome/NavBar';

export default function AppLayout() {
  return (
    <AppShell header={{ height: 48 }}>
      <NavBar />
      <AppShell.Main mt={48+32}>
        <Container size={1440}>
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
