import React from 'react';
import { Stack, Paper, Title, Divider, Group, Text, Box } from '@mantine/core';
import {
  IconClock,
  IconTag,
  IconUsers,
  IconCode,
  IconInfoCircle,
} from '@tabler/icons-react';
import { formatContestDate, formatWindowDuration } from '../../utils/contestUtils';

export default function ContestInfoTab({ contest, clarifications }) {
  if (!contest) return null;

  return (
    <Stack gap="md">
      {/* Contest Overview */}
      <Paper withBorder p="md">
        <Title order={4} mb="sm">Contest Overview</Title>
        <Divider mb="md" />
        <Stack gap="sm">
          <Group>
            <IconClock size={18} />
            <Text size="sm">
              <strong>Duration:</strong> {contest.start_time && contest.end_time && (
                <>
                  {formatContestDate(contest.start_time)} - {formatContestDate(contest.end_time)}
                </>
              )}
            </Text>
          </Group>
          {contest.time_limit && (
            <Group>
              <IconClock size={18} />
              <Text size="sm">
                <strong>Window:</strong> {formatWindowDuration(contest.time_limit)}
              </Text>
            </Group>
          )}
          <Group>
            <IconTag size={18} />
            <Text size="sm">
              <strong>Format:</strong> {contest.format || 'IOI'}
            </Text>
          </Group>
          {contest.rating_impact !== undefined && (
            <Group>
              <IconUsers size={18} />
              <Text size="sm">
                <strong>Rating Impact:</strong> {contest.rating_impact ? 'Yes' : 'No'}
              </Text>
            </Group>
          )}
          {contest.allowed_languages && contest.allowed_languages.length > 0 && (
            <Group>
              <IconCode size={18} />
              <Text size="sm">
                <strong>Allowed Languages:</strong> {contest.allowed_languages.join(', ')}
              </Text>
            </Group>
          )}
          {contest.eligibility && (
            <Group>
              <IconInfoCircle size={18} />
              <Text size="sm">
                <strong>Eligibility:</strong> {contest.eligibility}
              </Text>
            </Group>
          )}
        </Stack>
      </Paper>

      {/* Rules */}
      {contest.rules && (
        <Paper withBorder p="md">
          <Title order={4} mb="sm">Rules</Title>
          <Divider mb="md" />
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{contest.rules}</Text>
        </Paper>
      )}

      {/* Clarifications */}
      {clarifications.length > 0 && (
        <Paper withBorder p="md">
          <Title order={4} mb="sm">Clarifications</Title>
          <Divider mb="md" />
          <Stack gap="sm">
            {clarifications.map((clar) => (
              <Box key={clar.id}>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={500}>{clar.title || 'Clarification'}</Text>
                  {clar.created_at && (
                    <Text size="xs" c="dimmed">
                      {formatContestDate(clar.created_at)}
                    </Text>
                  )}
                </Group>
                <Text size="sm" c="dimmed">{clar.content}</Text>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

