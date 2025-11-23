import React from 'react';
import { Paper, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconClipboardList, IconAward } from '@tabler/icons-react';

export default function ContestInfoCard({ type, items }) {
  if (!items || items.length === 0) return null;

  const config = {
    rules: {
      icon: <IconClipboardList size={16} />,
      title: 'Rules',
    },
    prizes: {
      icon: <IconAward size={16} />,
      title: 'Prizes',
    },
  };

  const { icon, title } = config[type] || config.rules;

  return (
    <Paper withBorder radius="md" p="md" style={{ flex: 1, minWidth: 280 }}>
      <Group gap="sm" mb="sm">
        <ThemeIcon variant="light" radius="md">{icon}</ThemeIcon>
        <Text fw={600}>{title}</Text>
      </Group>
      <Stack gap={4}>
        {items.map((item, idx) => (
          <Text key={idx} size="sm">• {item}</Text>
        ))}
      </Stack>
    </Paper>
  );
}

