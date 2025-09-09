import React from 'react';
import { Paper, Grid, TextInput, Group, Text, Button, MultiSelect, useMantineTheme } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { ChipList, DIFFICULTY_OPTIONS, STATUS_OPTIONS } from '../../utils/filters.jsx';

export default function FilterToolbar({
  query,
  setQuery,
  count,
  clearFilters,
  difficulty,
  setDifficulty,
  status,
  setStatus,
  tags,
  setTags,
  tagsOptions = [],
}) {
  const theme = useMantineTheme();
  const hasActiveFilters = (
    (query && query.trim().length > 0) ||
    (Array.isArray(difficulty) && difficulty.length > 0) ||
    (Array.isArray(status) && status.length > 0) ||
    (Array.isArray(tags) && tags.length > 0)
  );
  return (
    <Paper
      withBorder
      radius="sm"
      p="sm"
      mb="xs"
      style={{
        position: 'sticky',
        // Refactoring UI — Tokenize sticky offsets (p. 70, p. 92)
        top: theme.spacing.sm,
        zIndex: 3,
        background: 'var(--mantine-color-body)',
      }}
    >
      <Grid gutter="xs" align="center">
        <Grid.Col span={7}>
          <TextInput
            placeholder="Search problems or tags…"
            leftSection={<IconSearch size={16} />}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            radius="xl"
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <Text size="sm" color="dimmed">
            {count} results
          </Text>
        </Grid.Col>
        <Grid.Col span={2} style={{ textAlign: 'right' }}>
          {/* Refactoring UI — Emphasize by de-emphasizing until actionable (p. 46) */}
          <Button variant="subtle" size="xs" onClick={clearFilters} disabled={!hasActiveFilters}>
            Clear
          </Button>
        </Grid.Col>
        <Grid.Col span={7}>
          <Group gap="sm" wrap="nowrap">
            <Text size="sm">
              Difficulty:
            </Text>
            <ChipList
              items={DIFFICULTY_OPTIONS}
              value={difficulty}
              onChange={setDifficulty}
            />
          </Group>
        </Grid.Col>
        <Grid.Col span={5}>
          <Group gap="sm" wrap="nowrap">
            <Text size="sm" fw={500}>
              Status:
            </Text>
            <ChipList items={STATUS_OPTIONS} value={status} onChange={setStatus} />
          </Group>
        </Grid.Col>
        <Grid.Col span={12}>
          <Group gap="sm" wrap="nowrap">
            <Text size="sm" fw={500}>
              Tags:
            </Text>
            <MultiSelect
              data={tagsOptions}
              placeholder="Select tags"
              searchable
              clearable
              radius="xl"
              w={420}
              value={tags}
              onChange={setTags}
            />
          </Group>
        </Grid.Col>
      </Grid>
    </Paper>
  );
} 
