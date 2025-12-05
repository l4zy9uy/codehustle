import React, { useEffect, useState } from 'react';
import { Title, Text, Stack, Group, Badge, Paper, Divider } from '@mantine/core';
import { listSubmissions } from '../lib/api/submissions';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Submissions() {
  const [items, setItems] = useState([]);

  usePageTitle('Submissions');

  useEffect(() => {
    listSubmissions().then((res) => setItems(res.items || [])).catch(() => setItems([]));
  }, []);

  return (
    <>
      <Title order={2} mb="md">Submissions</Title>
      <Paper withBorder radius="sm" p="md">
        <Divider mb="sm" />
        <Stack gap="xs">
          {items.length === 0 && <Text c="dimmed" size="sm">No submissions yet.</Text>}
          {items.map((s) => (
            <Group key={s.id} justify="space-between">
              <Text size="sm" c="dimmed">{new Date(s.submittedAt).toLocaleString()}</Text>
              <Text size="sm">{s.problemTitle}</Text>
              <Badge size="sm" variant="light">{s.verdict}</Badge>
              {s.language && <Text size="xs" c="dimmed">{s.language}</Text>}
            </Group>
          ))}
        </Stack>
      </Paper>
    </>
  );
}
