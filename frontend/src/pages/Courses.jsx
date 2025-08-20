import React from 'react';
import { MantineProvider, AppShell, Container, Title, Text } from '@mantine/core';
import NavBar from '../components/StudentHome/NavBar';

export default function Courses() {
  return (
    <>
      <Title order={2} mb="md">Courses</Title>
      <Text>This is the Courses page.</Text>
    </>
  );
} 