import React from 'react';
import { Paper, Grid, TextInput, Group, Text, Button, MultiSelect } from '@mantine/core';
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
  return (
    <Paper
      withBorder
      radius="sm"
      p="sm"
      mb="xs"
      style={{
        position: 'sticky',
        top: '8px',
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
          <Button variant="subtle" size="xs" onClick={clearFilters}>
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
