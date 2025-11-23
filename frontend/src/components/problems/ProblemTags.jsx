import React, { useState } from 'react';
import { Box, Group, Text, ActionIcon, Collapse, Badge } from '@mantine/core';
import { IconTag, IconChevronUp, IconChevronDown } from '@tabler/icons-react';

function TagList({ tags = [] }) {
  if (!tags.length) return null;
  return (
    <Group gap={8} wrap="wrap">
      {tags.map((t) => (
        <Badge key={t} variant="light" radius="xl" leftSection={<IconTag size={14} />}>{t}</Badge>
      ))}
    </Group>
  );
}

export default function ProblemTags({ problem }) {
  const [opened, setOpened] = useState(false);
  const hasTags = Array.isArray(problem?.tags) && problem.tags.length > 0;
  if (!hasTags) return null;
  return (
    <Box>
      <Group justify="space-between" align="center">
        <Text size="sm" c="dimmed">Tags</Text>
        <ActionIcon
          size="sm"
          variant="subtle"
          color="gray"
          onClick={() => setOpened((v) => !v)}
          aria-expanded={opened}
          aria-label="Toggle tags"
        >
          {opened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
        </ActionIcon>
      </Group>
      <Collapse in={opened}>
        <Box mt="xs">
          <TagList tags={problem.tags} />
        </Box>
      </Collapse>
    </Box>
  );
}

