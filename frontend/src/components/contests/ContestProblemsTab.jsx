import React from 'react';
import { Paper, Table, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

export default function ContestProblemsTab({ problems }) {
  const navigate = useNavigate();

  return (
    <Paper withBorder p="sm">
      <Table striped highlightOnHover withRowBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Problem</Table.Th>
            <Table.Th>Points</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {problems.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={2}>
                <Text size="sm" c="dimmed" ta="center" py="md">
                  No problems available.
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            problems.map((problem, index) => (
              <Table.Tr
                key={problem.id || problem.code}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/problems/${problem.code || problem.slug}`)}
              >
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {String.fromCharCode(65 + index)}. {problem.name || problem.title}
                  </Text>
                  {problem.code && (
                    <Text size="xs" c="dimmed">
                      ({problem.code})
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{problem.points || 0}</Text>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}

