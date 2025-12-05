import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Skeleton,
  Text,
  Stack,
  Group,
  Paper,
  Divider,
  Tabs,
  Badge,
  ThemeIcon,
} from '@mantine/core';
import {
  IconInfoCircle,
  IconListCheck,
  IconCode,
  IconTrophy,
  IconClock,
  IconCalendarTime,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { useContestDetail } from '../hooks/useContestDetail';
import { formatContestDate, formatWindowDuration } from '../utils/contestUtils';
import ContestHeader from '../components/contests/ContestHeader';
import ContestInfoCard from '../components/contests/ContestInfoCard';
import ContestInfoTab from '../components/contests/ContestInfoTab';
import ContestProblemsTab from '../components/contests/ContestProblemsTab';
import ContestSubmissionsTab from '../components/contests/ContestSubmissionsTab';
import ContestRankingsTab from '../components/contests/ContestRankingsTab';
import { usePageTitle } from '../hooks/usePageTitle';

export default function ContestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info');

  const {
    contest,
    problems,
    submissions,
    rankings,
    clarifications,
    loading,
    submissionFilter,
    setSubmissionFilter,
    status,
    isParticipating,
    showRankings,
    contestRules,
    contestPrizes,
    handleJoin,
    loadSubmissions,
    loadRankings,
  } = useContestDetail(id);

  useEffect(() => {
    if (activeTab === 'submissions') {
      loadSubmissions();
    }
  }, [activeTab, loadSubmissions]);

  usePageTitle(contest?.name ? `${contest.name} - Contest` : 'Contest');

  useEffect(() => {
    if (activeTab === 'rankings') {
      loadRankings();
    }
  }, [activeTab, loadRankings]);

  if (loading) {
    return (
      <Box p="md" style={{ maxWidth: 1440, margin: '0 auto' }}>
        <Skeleton height={40} mb="md" />
        <Skeleton height={200} />
      </Box>
    );
  }

  if (!contest) {
    return (
      <Box p="md" style={{ maxWidth: 1440, margin: '0 auto' }}>
        <Text>Contest not found</Text>
      </Box>
    );
  }

  const shortDescription = contest?.short_description || contest?.description;
  const contestTags = contest?.tags || [];
  const scoreboardFreezeAt = contest?.scoreboardFreezeAt || contest?.scoreboard_freeze_at;
  const freezeLabel = scoreboardFreezeAt ? formatContestDate(scoreboardFreezeAt) : 'No freeze';
  const durationLabel = contest?.time_limit
    ? formatWindowDuration(contest.time_limit)
    : contest?.duration
      ? `${contest.duration}h window`
      : 'Flexible window';

  return (
    <Box p="md" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <ContestHeader
        contest={contest}
        status={status}
        isParticipating={isParticipating}
        onJoin={handleJoin}
      />

      <Paper withBorder radius="md" p="md" mb="lg">
        <Stack gap="sm">
          {shortDescription && <Text size="sm" c="dimmed">{shortDescription}</Text>}
          {contestTags.length > 0 && (
            <Group gap="xs" wrap="wrap">
              {contestTags.map((tag) => (
                <Badge key={tag} variant="light">{tag}</Badge>
              ))}
            </Group>
          )}
          <Divider my="xs" />
          <Group gap="lg" wrap="wrap">
            {[{
              label: 'Format',
              value: `${contest.format || 'Standard'} • ${contest.type || 'individual'}`,
              icon: <IconInfoCircle size={16} />,
            }, {
              label: 'Duration',
              value: durationLabel,
              icon: <IconClock size={16} />,
            }, {
              label: 'Scoreboard freeze',
              value: freezeLabel,
              icon: <IconCalendarTime size={16} />,
            }].map((item) => (
              <Group key={item.label} gap="sm">
                <ThemeIcon variant="light" radius="md">
                  {item.icon}
                </ThemeIcon>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">{item.label}</Text>
                  <Text fw={600}>{item.value}</Text>
                </Stack>
              </Group>
            ))}
          </Group>
        </Stack>
      </Paper>

      {(contestRules.length > 0 || contestPrizes.length > 0) && (
        <Group align="stretch" gap="md" mb="lg" wrap="wrap">
          {contestRules.length > 0 && (
            <ContestInfoCard type="rules" items={contestRules} />
          )}
          {contestPrizes.length > 0 && (
            <ContestInfoCard type="prizes" items={contestPrizes} />
          )}
        </Group>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab} mb="md">
        <Tabs.List>
          <Tabs.Tab value="info" leftSection={<IconInfoCircle size={16} />}>
            Info
          </Tabs.Tab>
          <Tabs.Tab value="problems" leftSection={<IconListCheck size={16} />}>
            Problems
          </Tabs.Tab>
          <Tabs.Tab value="submissions" leftSection={<IconCode size={16} />}>
            Submissions
          </Tabs.Tab>
          {showRankings && (
            <Tabs.Tab value="rankings" leftSection={<IconTrophy size={16} />}>
              Rankings
            </Tabs.Tab>
          )}
        </Tabs.List>

        <Tabs.Panel value="info" pt="md">
          <ContestInfoTab contest={contest} clarifications={clarifications} />
        </Tabs.Panel>

        <Tabs.Panel value="problems" pt="md">
          <ContestProblemsTab problems={problems} />
        </Tabs.Panel>

        <Tabs.Panel value="submissions" pt="md">
          <ContestSubmissionsTab
            user={user}
            problems={problems}
            submissions={submissions}
            submissionFilter={submissionFilter}
            setSubmissionFilter={setSubmissionFilter}
            loadSubmissions={loadSubmissions}
          />
        </Tabs.Panel>

        <Tabs.Panel value="rankings" pt="md">
          <ContestRankingsTab
            showRankings={showRankings}
            rankings={rankings}
            loadRankings={loadRankings}
          />
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}
