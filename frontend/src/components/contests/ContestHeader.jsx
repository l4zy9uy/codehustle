import React from 'react';
import { Breadcrumbs, Anchor, Title, Text, Stack, Group, Badge, Button } from '@mantine/core';
import { Link } from 'react-router-dom';
import { formatContestDate } from '../../utils/contestUtils';
import { statusColors, statusLabels } from '../../constants/contests';

export default function ContestHeader({ contest, status, isParticipating, onJoin }) {
  if (!contest) return null;

  return (
    <>
      <Breadcrumbs mb="sm">
        <Anchor component={Link} to="/contests">Contests</Anchor>
        <Text c="dimmed">{contest.name}</Text>
      </Breadcrumbs>

      <Group justify="space-between" align="flex-start" mb="md">
        <Stack gap="xs">
          <Group gap="md" align="center">
            <Title order={1}>{contest.name}</Title>
            <Badge color={statusColors[status]} variant="light" size="lg">
              {statusLabels[status]}
            </Badge>
          </Group>
          {contest.start_time && contest.end_time && (
            <Text size="sm" c="dimmed">
              {formatContestDate(contest.start_time)} - {formatContestDate(contest.end_time)}
            </Text>
          )}
        </Stack>
        {!isParticipating && status !== 'ended' && (
          <Group>
            {status === 'upcoming' && (
              <Button onClick={() => onJoin(false)}>Join</Button>
            )}
            {status === 'ended' && (
              <Button variant="light" onClick={() => onJoin(true)}>
                Virtual Join
              </Button>
            )}
          </Group>
        )}
      </Group>
    </>
  );
}

