import React from 'react';
import { MantineProvider, AppShell, Container, Title, Text } from '@mantine/core';
import NavBar from '../components/StudentHome/NavBar';

export default function Submissions() {
  return (
    <>
      <Title order={2} mb="md">Submissions</Title>
      <Text>This is the Submissions page.</Text>
    </>
  );
} 