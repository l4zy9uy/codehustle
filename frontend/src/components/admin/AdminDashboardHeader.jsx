import React from 'react';
import { Group, Stack, Title, Text } from '@mantine/core';

export default function AdminDashboardHeader({ lastUpdatedText }) {
  return (
    <Group align="flex-start" justify="space-between" wrap="wrap" gap="md">
      <Stack gap={4}>
        <Title order={2}>Admin Control Center</Title>
        <Text c="dimmed">Insight into platform health, moderation, and onboarding queues.</Text>
        <Text size="xs" c="dimmed">Last synced {lastUpdatedText}</Text>
      </Stack>
    </Group>
  );
}

