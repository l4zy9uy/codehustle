import React from 'react';
import { MantineProvider, AppShell, Container, Title, Text } from '@mantine/core';
import NavBar from '../components/StudentHome/NavBar';

export default function Problems() {
  return (
    <>
      <Title order={2} mb="md">Problems</Title>
      <Text>This is the Problems page.</Text>
    </>
  );
} 