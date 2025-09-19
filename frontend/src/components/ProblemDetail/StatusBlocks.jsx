import React from 'react';
import { Stack, Group, Text, Button, Collapse, SimpleGrid, Box } from '@mantine/core';
import { IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import { CODE_BLOCK_BOX, DIFF_HL_LEFT, DIFF_HL_RIGHT } from './constants';
import CopyPre from '../CopyPre';

export function StatusAC() {
  return <Text size="sm" c="teal">Accepted</Text>;
}
export function StatusTLE() {
  return <Text size="sm" c="dimmed">Time Limit Exceeded</Text>;
}
export function StatusPending() {
  return (
    <Group gap={8} align="center">
      <div className="mantine-Loader-root" />
      <Text size="sm" c="dimmed">Judging…</Text>
    </Group>
  );
}

export function StatusCE({ s, showMoreMap, setShowMoreMap, truncate }) {
  return (
    <Stack gap={6}>
      <Text size="sm" fw={600}>Compiler output</Text>
      <Box style={CODE_BLOCK_BOX}>
        <CopyPre text={truncate(String(s.compileLog || ''), showMoreMap[s.id + '_ce'] ? 4000 : 500)} style={{ margin: 0 }} showCopy={false} />
      </Box>
      <Group justify="flex-end">
        <Button size="xs" variant="subtle" color="gray" onClick={() => setShowMoreMap((m) => ({ ...m, [s.id + '_ce']: !m[s.id + '_ce'] }))}>{showMoreMap[s.id + '_ce'] ? 'Show less' : 'Show more'}</Button>
      </Group>
    </Stack>
  );
}

export function StatusRTE({ s, showMoreMap, setShowMoreMap, truncate }) {
  return (
    <Stack gap={6}>
      <Text size="sm" fw={600}>Runtime error</Text>
      <Box style={CODE_BLOCK_BOX}>
        <CopyPre text={truncate(String(s.runtimeError || ''), showMoreMap[s.id + '_re'] ? 4000 : 500)} style={{ margin: 0 }} showCopy={false} />
      </Box>
      <Group justify="flex-end">
        <Button size="xs" variant="subtle" color="gray" onClick={() => setShowMoreMap((m) => ({ ...m, [s.id + '_re']: !m[s.id + '_re'] }))}>{showMoreMap[s.id + '_re'] ? 'Show less' : 'Show more'}</Button>
      </Group>
    </Stack>
  );
}

export function DiffCase({ fc, showMoreMap, setShowMoreMap, openInputMap, setOpenInputMap, truncate }) {
  const showAll = !!showMoreMap[fc.id];
  const yourText = showAll ? fc.your : truncate(fc.your, 256);
  const expectedText = showAll ? fc.expected : truncate(fc.expected, 256);
  const inputOpen = !!openInputMap[fc.id];
  return (
    <Stack key={fc.id} gap={6}>
      <Group justify="space-between" align="center">
        <Text size="sm" c="dimmed">{fc.summary}</Text>
        <Button size="xs" variant="subtle" color="gray" leftSection={inputOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />} onClick={() => setOpenInputMap((m) => ({ ...m, [fc.id]: !m[fc.id] }))}>Input</Button>
      </Group>
      <Collapse in={inputOpen}>
        <Box style={CODE_BLOCK_BOX}>
          <CopyPre text={fc.input} style={{ margin: 0 }} showCopy={true} />
        </Box>
      </Collapse>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
        <Stack gap={4}>
          <Text size="xs" c="dimmed">Your Output</Text>
          <Box style={CODE_BLOCK_BOX}>
            {yourText.split('\n').map((line, idx) => (
              <div key={idx} style={{ background: (fc.diffLines?.left || []).includes(idx) ? DIFF_HL_LEFT : 'transparent', fontFamily: 'var(--mantine-font-family-monospace)' }}>{line}</div>
            ))}
          </Box>
        </Stack>
        <Stack gap={4}>
          <Text size="xs" c="dimmed">Expected Output</Text>
          <Box style={CODE_BLOCK_BOX}>
            {expectedText.split('\n').map((line, idx) => (
              <div key={idx} style={{ background: (fc.diffLines?.right || []).includes(idx) ? DIFF_HL_RIGHT : 'transparent', fontFamily: 'var(--mantine-font-family-monospace)' }}>{line}</div>
            ))}
          </Box>
        </Stack>
      </SimpleGrid>
      <Group justify="flex-end">
        <Button size="xs" variant="subtle" color="gray" onClick={() => setShowMoreMap((m) => ({ ...m, [fc.id]: !m[fc.id] }))}>{showAll ? 'Show less' : 'Show more'}</Button>
      </Group>
    </Stack>
  );
}

export function StatusWA(props) {
  const { s } = props;
  const cases = (s.failedCases && s.failedCases.length ? s.failedCases : [
    { id: 'mock1', summary: 'Mismatch at line 3', input: '3\n1 2 3', your: '6\n1 2', expected: '6\n1 2 3', diffLines: { left: [1], right: [1] } },
  ]);
  return (
    <Stack gap={8}>
      <Text size="sm" fw={600}>Failed cases</Text>
      {cases.map((fc) => (
        <DiffCase key={fc.id} fc={fc} {...props} />
      ))}
    </Stack>
  );
} 