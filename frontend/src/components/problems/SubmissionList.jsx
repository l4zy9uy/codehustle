import React from 'react';
import { Stack, Text, Table } from '@mantine/core';
import SubmissionRow from '../ProblemDetail/SubmissionRow';
import SubmissionDetail from '../ProblemDetail/SubmissionDetail';
import { useSubmissionExpansion } from '../../hooks/useSubmissionExpansion';

export default function SubmissionList({ items = [] }) {
  const {
    expandedId,
    loadingMap,
    showMoreMap,
    setShowMoreMap,
    openInputMap,
    setOpenInputMap,
    toggleExpand,
    truncate,
  } = useSubmissionExpansion();

  return (
    <Stack gap="sm">
      {items.length === 0 && (
        <Text size="sm" c="dimmed">No submissions yet.</Text>
      )}
      {items.length > 0 && (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: "40%", paddingLeft: 12 }}>Status</Table.Th>
              <Table.Th style={{ width: "35%", paddingLeft: 12 }}>Language</Table.Th>
              <Table.Th style={{ width: "25%", paddingLeft: 12 }}>Time</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((s, idx) => (
              <SubmissionRow submission={s} onClick={() => toggleExpand(s)} key={s.id} index={idx}>
                {expandedId === s.id && (
                  <SubmissionDetail
                    s={s}
                    loading={!!loadingMap[s.id]}
                    showMoreMap={showMoreMap}
                    setShowMoreMap={setShowMoreMap}
                    openInputMap={openInputMap}
                    setOpenInputMap={setOpenInputMap}
                    truncate={truncate}
                  />
                )}
              </SubmissionRow>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}

