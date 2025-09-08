import React from 'react';
import { Table, ScrollArea, Divider, Group, Anchor, Text, Paper } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { difficultyColor } from '../../utils/filters.jsx';

export default function ProblemsTable({ problems = [] }) {
  return (
    <Paper withBorder radius="sm" p="sm">
      <Divider mb="xs" />
      <ScrollArea.Autosize mah={600}>
        <Table striped highlightOnHover withRowBorders={false} verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 56 }}>#</Table.Th>
              <Table.Th style={{ width: 36, textAlign: 'center' }} aria-label="Solved by me">
                {/* Solved tick column */}
              </Table.Th>
              <Table.Th>Problem</Table.Th>
              <Table.Th style={{ width: 120 }}>Diff</Table.Th>
              <Table.Th style={{ width: 100, textAlign: 'right' }}>AC%</Table.Th>
              <Table.Th style={{ width: 120, textAlign: 'right' }}>Solved</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {problems.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text color="dimmed" size="sm">
                    No problems found.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {problems.map((p, idx) => (
              <Table.Tr key={p.id}>
                <Table.Td>{p.index ?? idx + 1}</Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>
                  {p.solved ? <IconCheck size={16} aria-label="Solved" title="Solved" /> : null}
                </Table.Td>
                <Table.Td>
                  <Anchor href={p.href}>{p.title}</Anchor>
                </Table.Td>
                <Table.Td>
                  <Text
                    size="sm"
                    style={{ color: `var(--mantine-color-${difficultyColor(p.difficulty)}-6)` }}
                  >
                    {p.difficulty}
                  </Text>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  {p.acceptanceRate ?? '—'}%
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  {typeof p.solvedCount === 'number' ? p.solvedCount.toLocaleString() : '—'}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea.Autosize>
    </Paper>
  );
}
