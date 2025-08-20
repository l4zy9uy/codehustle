import React from 'react';
import { Table, ScrollArea, Divider, Group, Anchor, Text, Badge, Paper } from '@mantine/core';
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
              <Table.Th>Problem</Table.Th>
              <Table.Th style={{ width: 320 }}>Tags</Table.Th>
              <Table.Th style={{ width: 120 }}>Diff</Table.Th>
              <Table.Th style={{ width: 100, textAlign: 'right' }}>AC%</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {problems.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text color="dimmed" size="sm">
                    No problems found.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {problems.map((p, idx) => (
              <Table.Tr key={p.id}>
                <Table.Td>{p.index ?? idx + 1}</Table.Td>
                <Table.Td>
                  <Group gap={8} wrap="nowrap" align="center">
                    {p.solved ? (
                      <IconCheck size={16} aria-label="Solved" title="Solved" />
                    ) : (
                      <span aria-hidden="true" title="Unsolved">
                        ·
                      </span>
                    )}
                    <Anchor href={p.href}>{p.title}</Anchor>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group gap={6} wrap="wrap">
                    {(p.tags || []).slice(0, 4).map((t) => (
                      <Badge key={t} variant="light" radius="xl">
                        {t}
                      </Badge>
                    ))}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group gap={8} wrap="nowrap" align="center">
                    <span
                      aria-hidden="true"
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: `var(--mantine-color-${difficultyColor(
                          p.difficulty
                        )}-6)`,
                      }}
                    />
                    <Text size="sm">{p.difficulty}</Text>
                  </Group>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  {p.acceptanceRate ?? '—'}%
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea.Autosize>
    </Paper>
  );
} 