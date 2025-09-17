import React from 'react';
import { Paper, Flex, TextInput, Group, Text, Button, MultiSelect } from '@mantine/core';
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
  const hasActiveFilters = (
    (typeof query === 'string' && query.trim().length > 0) ||
    (typeof difficulty === 'string' && difficulty !== 'all') ||
    (typeof status === 'string' && status !== 'all') ||
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
        // Stick below the fixed header with comfortable offset
        top: 'calc(var(--app-header-h) + var(--mantine-spacing-md))',
        zIndex: 3,
        background: 'var(--mantine-color-body)',
      }}
    >
      <Flex align="center" gap="xs" wrap="wrap">
        {/* Left cluster: Search + Tags (capped widths) */}
        <Group gap="xs" wrap="wrap" align="center">
          <TextInput
            placeholder="Search problems or tags…"
            leftSection={<IconSearch size={16} />}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            radius="xl"
            style={{ width: '240px' }}
          />
          <MultiSelect
            data={tagsOptions}
            placeholder="Tags…"
            searchable
            clearable
            radius="xl"
            style={{ width: '120px' }}
            value={tags}
            onChange={setTags}
          />
        </Group>

        {/* Right cluster: results count + clear button */}
        <Group gap="xs" align="center" style={{ marginLeft: 'auto' }}>
          <Text size="sm" color="dimmed">
            {count} results
          </Text>
          {/* Refactoring UI — Emphasize by de-emphasizing until actionable (p. 46) */}
          <Button variant="subtle" size="xs" onClick={clearFilters} disabled={!hasActiveFilters}>
            Clear
          </Button>
        </Group>

        {/* Second row: chips (wrap, compact) */}
        <Group gap="sm" wrap="wrap" w="100%">
          <Group gap="sm">
            <Text size="sm">Difficulty</Text>
            <ChipList items={DIFFICULTY_OPTIONS} value={difficulty} onChange={setDifficulty} />
          </Group>
          <Group gap="sm">
            <Text size="sm" fw={500}>Status</Text>
            <ChipList items={STATUS_OPTIONS} value={status} onChange={setStatus} />
          </Group>
        </Group>
      </Flex>
    </Paper>
  );
} 
