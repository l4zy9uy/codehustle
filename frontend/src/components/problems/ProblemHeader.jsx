import React from 'react';
import { Group, Title, Badge, Stack, Text, Tooltip, ThemeIcon } from '@mantine/core';
import { IconClock, IconCpu, IconInfoCircle, IconChecks, IconTag } from '@tabler/icons-react';
import { DIFF_COLOR } from '../../constants/problems';

function DifficultyBadge({ level }) {
  const key = (level || "").toLowerCase();
  const color = DIFF_COLOR[key] || "gray";
  const label = key ? key[0].toUpperCase() + key.slice(1) : "Unknown";
  const textColorVar = `var(--mantine-color-${color}-6)`;
  return (
    <Badge size="md" variant="light" color="gray" radius="xl" style={{ color: textColorVar }}>
      {label}
    </Badge>
  );
}

function MetaRow({ icon, label, value, tooltip }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <Tooltip label={tooltip} openDelay={300}>
      <Group gap={6} wrap="nowrap">
        <ThemeIcon size={22} radius="md" variant="light">
          {icon}
        </ThemeIcon>
        <Text size="sm" c="dimmed">{label}:</Text>
        <Text size="sm" fw={600}>{value}</Text>
      </Group>
    </Tooltip>
  );
}

export default function ProblemHeader({ problem, timeLimit, memLimit, accRate }) {
  return (
    <>
      {/* Title */}
      <Group align="center" gap="sm" wrap="wrap">
        <Title order={1} style={{ lineHeight: 1.15 }}>{problem.title}</Title>
      </Group>
      {/* Difficulty and solved */}
      <Group align="center" gap="sm" wrap="nowrap">
        <DifficultyBadge level={problem.difficulty} />
        {problem.solved_by_me && (
          <Badge leftSection={<IconChecks size={14} />} color="teal" variant="light" size="md" radius="xl">
            Solved
          </Badge>
        )}
      </Group>
      {/* Meta */}
      <Group gap="lg" wrap="wrap">
        <MetaRow
          icon={<IconClock size={16} />}
          label="Time limit"
          value={timeLimit}
          tooltip="Maximum time (seconds) allowed during grading"
        />
        <MetaRow
          icon={<IconCpu size={16} />}
          label="Memory limit"
          value={memLimit}
          tooltip="Maximum resident memory (RSS) allowed during grading"
        />
        <MetaRow
          icon={<IconInfoCircle size={16} />}
          label="Acceptance"
          value={accRate}
          tooltip="Acceptance rate"
        />
      </Group>
    </>
  );
}

