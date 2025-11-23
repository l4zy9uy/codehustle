import React, { useEffect } from 'react';
import { Stack, Group, Select, Paper, Table, Text, Badge } from '@mantine/core';
import { formatContestDate } from '../../utils/contestUtils';
import { useNavigate } from 'react-router-dom';

export default function ContestSubmissionsTab({ 
  user, 
  problems, 
  submissions, 
  submissionFilter, 
  setSubmissionFilter,
  loadSubmissions 
}) {
  const navigate = useNavigate();

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  if (!user) {
    return (
      <Paper withBorder p="md">
        <Text size="sm" c="dimmed" ta="center">
          Please log in to view your submissions.
        </Text>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      {/* Filters */}
      <Group>
        <Select
          placeholder="Filter by problem"
          data={[
            { value: 'all', label: 'All Problems' },
            ...problems.map((p) => ({
              value: p.code || p.id,
              label: p.name || p.title,
            })),
          ]}
          value={submissionFilter.problem}
          onChange={(value) =>
            setSubmissionFilter({ ...submissionFilter, problem: value || 'all' })
          }
          style={{ flex: 1, maxWidth: 200 }}
          size="sm"
        />
        <Select
          placeholder="Filter by language"
          data={[
            { value: 'all', label: 'All Languages' },
            { value: 'cpp', label: 'C++' },
            { value: 'java', label: 'Java' },
            { value: 'python', label: 'Python' },
          ]}
          value={submissionFilter.language}
          onChange={(value) =>
            setSubmissionFilter({ ...submissionFilter, language: value || 'all' })
          }
          style={{ flex: 1, maxWidth: 200 }}
          size="sm"
        />
        <Select
          placeholder="Filter by status"
          data={[
            { value: 'all', label: 'All Status' },
            { value: 'AC', label: 'Accepted' },
            { value: 'WA', label: 'Wrong Answer' },
            { value: 'TLE', label: 'Time Limit Exceeded' },
            { value: 'CE', label: 'Compilation Error' },
            { value: 'RTE', label: 'Runtime Error' },
          ]}
          value={submissionFilter.status}
          onChange={(value) =>
            setSubmissionFilter({ ...submissionFilter, status: value || 'all' })
          }
          style={{ flex: 1, maxWidth: 200 }}
          size="sm"
        />
      </Group>

      {/* Submissions Table */}
      <Paper withBorder p="sm">
        <Table striped highlightOnHover withRowBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Time</Table.Th>
              <Table.Th>Problem</Table.Th>
              <Table.Th>Language</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Score</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {submissions.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text size="sm" c="dimmed" ta="center" py="md">
                    No submissions yet.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              submissions.map((sub) => (
                <Table.Tr
                  key={sub.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/submissions/${sub.id}`)}
                >
                  <Table.Td>
                    <Text size="sm">
                      {sub.submitted_at
                        ? formatContestDate(sub.submitted_at)
                        : 'Unknown'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{sub.problem_name || sub.problem_code || 'Unknown'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{sub.language || 'N/A'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        sub.status === 'AC'
                          ? 'green'
                          : sub.status === 'WA'
                          ? 'red'
                          : sub.status === 'TLE'
                          ? 'yellow'
                          : 'gray'
                      }
                      variant="light"
                      size="sm"
                    >
                      {sub.status || 'Pending'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{sub.score !== undefined ? sub.score : '-'}</Text>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  );
}
