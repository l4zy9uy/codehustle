import React from 'react';
import { Group, Text, Stack, Loader } from '@mantine/core';
// import { IconCopy } from '@tabler/icons-react';
import CopyPre from '../CopyPre';
import { CODE_PREVIEW_BOX } from './constants';
import { StatusAC, StatusTLE, StatusPending, StatusCE, StatusRTE, StatusWA } from './StatusBlocks';

export default function SubmissionDetail({ s, loading, showMoreMap, setShowMoreMap, openInputMap, setOpenInputMap, truncate }) {
  return (
    <>
      {loading ? (
        <Group gap={8} align="center">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">Loading details…</Text>
        </Group>
      ) : (
        <Stack gap={12}>
          <Group justify="space-between" align="center">
            <Text size="sm" fw={600}>Source code</Text>
          </Group>

          <CopyPre text={String(s.source || '').slice(0, 8000)} style={CODE_PREVIEW_BOX} />

          {s.status === 'AC' && (<StatusAC />)}
          {s.status === 'TLE' && (<StatusTLE />)}
          {s.status === 'PENDING' && (<StatusPending />)}
          {s.status === 'CE' && (
            <StatusCE s={s} showMoreMap={showMoreMap} setShowMoreMap={setShowMoreMap} truncate={truncate} />
          )}
          {s.status === 'RTE' && (
            <StatusRTE s={s} showMoreMap={showMoreMap} setShowMoreMap={setShowMoreMap} truncate={truncate} />
          )}
          {s.status === 'WA' && (
            <StatusWA s={s} showMoreMap={showMoreMap} setShowMoreMap={setShowMoreMap} openInputMap={openInputMap} setOpenInputMap={setOpenInputMap} truncate={truncate} />
          )}
        </Stack>
      )}
    </>
  );
} 