import React from 'react';
import { MantineProvider, AppShell, Container, Title, Text } from '@mantine/core';
import NavBar from '../components/StudentHome/NavBar';

export default function Announcements() {
  return (
    <>
      <Title order={2} mb="md">Announcements</Title>
      <Text>This is the Announcements page.</Text>
    </>
  );
} 