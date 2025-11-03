import React from 'react';
import { Table, ScrollArea, Divider, Group, Anchor, Text, Paper, ActionIcon } from '@mantine/core';
import { IconCheck, IconEdit } from '@tabler/icons-react';
import { difficultyColor } from '../../utils/filters.jsx';
import { useAuth } from '../../context/AuthContext';

export default function ProblemsTable({ problems = [] }) {
  const { user } = useAuth();
  
  // Check if user has edit permissions (admin or editor role)
  const canEdit = user?.role === 'admin' || user?.role === 'editor';

  return (
    <Paper withBorder radius="sm" p="sm">
      <Divider mb="xs" />
      <ScrollArea.Autosize mah={600}>
        <Table striped highlightOnHover withRowBorders={false} verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 26, paddingLeft: 8 }}>#</Table.Th>
              <Table.Th style={{ width: 36, textAlign: 'center' }} aria-label="Solved by me">
                {/* Solved tick column */}
              </Table.Th>
              <Table.Th>Problem</Table.Th>
              <Table.Th style={{ width: 120 }}>Diff</Table.Th>
              <Table.Th style={{ width: 100, textAlign: 'right' }}>AC%</Table.Th>
              <Table.Th style={{ width: 120, textAlign: 'right' }}>Solved</Table.Th>
              {canEdit && (
                <Table.Th style={{ width: 60, textAlign: 'center' }}>Edit</Table.Th>
              )}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {problems.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={canEdit ? 7 : 6}>
                  <Text color="dimmed" size="sm">
                    No problems found.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {problems.map((p, idx) => (
              <Table.Tr key={p.slug}>
                <Table.Td style={{ paddingLeft: 8 }}>{p.index ?? idx + 1}</Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>
                  {p.solved ? <IconCheck size={16} aria-label="Solved" title="Solved" /> : null}
                </Table.Td>
                <Table.Td style={{ verticalAlign: 'baseline' }}>
                  <Anchor href={`/problems/${p.slug}`}>{p.name}</Anchor>
                </Table.Td>
                <Table.Td>
                  <Text
                    size="sm"
                    style={{ color: `var(--mantine-color-${difficultyColor(p.diff)}-6)` }}
                  >
                    {p.diff}
                  </Text>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  {p.acceptanceRate ?? '—'}%
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  {typeof p.solvedCount === 'number' ? p.solvedCount.toLocaleString() : '—'}
                </Table.Td>
                {canEdit && (
                  <Table.Td style={{ textAlign: 'center' }}>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={() => window.location.href = `/problems/${p.slug}/edit`}
                      title="Edit problem"
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea.Autosize>
    </Paper>
  );
}
