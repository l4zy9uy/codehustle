import React, { useEffect } from 'react';
import { Paper, Table, Text } from '@mantine/core';

export default function ContestRankingsTab({ showRankings, rankings, loadRankings }) {
  useEffect(() => {
    if (showRankings) {
      loadRankings();
    }
  }, [showRankings, loadRankings]);

  if (!showRankings) {
    return (
      <Paper withBorder p="md">
        <Text size="sm" c="dimmed" ta="center">
          Rankings will be available after the contest ends.
        </Text>
      </Paper>
    );
  }

  return (
    <Paper withBorder p="sm">
      <Table striped highlightOnHover withRowBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Rank</Table.Th>
            <Table.Th>User</Table.Th>
            <Table.Th>Problems Solved</Table.Th>
            <Table.Th>Total Points</Table.Th>
            <Table.Th>Penalty</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rankings.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text size="sm" c="dimmed" ta="center" py="md">
                  No rankings available yet.
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            rankings.map((rank, index) => (
              <Table.Tr key={rank.user_id || index}>
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {rank.rank || index + 1}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{rank.username || rank.user_name || 'Unknown'}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{rank.problems_solved || rank.solved_count || 0}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{rank.total_points || rank.points || 0}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{rank.penalty || 0}</Text>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
