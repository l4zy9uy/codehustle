import React from 'react';
import { Paper, Flex, TextInput, Group, Text, Button, MultiSelect, Select } from '@mantine/core';
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
  const DIFF_LABEL_VALUE = '__diff_label__';
  const STATUS_LABEL_VALUE = '__status_label__';

  const difficultyData = [
    { value: DIFF_LABEL_VALUE, label: 'Difficulty', disabled: true },
    ...DIFFICULTY_OPTIONS.map(o => ({ value: o.value, label: o.label }))
  ];
  const statusData = [
    { value: STATUS_LABEL_VALUE, label: 'Status', disabled: true },
    ...STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }))
  ];
  const tagsCompactStyle = (Array.isArray(tags) && tags.length > 2)
    ? { flex: 1, minWidth: 160 }
    : { width: 160, flex: '0 0 auto' };
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

        {/* Second row: compact filters (wrap, compact) */}
        <Group gap="sm" wrap="wrap" w="100%" style={{ alignItems: 'center' }}>
          <Select
            data={difficultyData}
            value={difficulty === 'all' ? DIFF_LABEL_VALUE : difficulty}
            onChange={(v) => { if (v && v !== DIFF_LABEL_VALUE) setDifficulty(v); }}
            allowDeselect={false}
            size="xs"
            radius={8}
            style={{ width: 120, flex: '0 0 auto' }}
          />
          <Select
            data={statusData}
            value={status === 'all' ? STATUS_LABEL_VALUE : status}
            onChange={(v) => { if (v && v !== STATUS_LABEL_VALUE) setStatus(v); }}
            allowDeselect={false}
            size="xs"
            radius={8}
            style={{ width: 120, flex: '0 0 auto' }}
          />
          <MultiSelect
            data={tagsOptions}
            placeholder="Tags"
            searchable
            clearable
            size="xs"
            radius={8}
            style={{ width: 'auto', minWidth: 160, maxWidth: 'calc(100% - 280px)' }}
            value={tags}
            onChange={setTags}
            styles={{ inputField: { display: (Array.isArray(tags) && tags.length > 0) ? 'none' : undefined }, pillsList: { gap: 4 } }}
          />
        </Group>
      </Flex>
    </Paper>
  );
} 
