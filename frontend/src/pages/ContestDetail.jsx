import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Breadcrumbs,
  Anchor,
  Title,
  Text,
  Stack,
  Group,
  Badge,
  Paper,
  Divider,
  Tabs,
  Table,
  Button,
  Select,
  Skeleton,
  Loader,
  Box,
  ThemeIcon,
} from '@mantine/core';
import { parseISO, format } from 'date-fns';
import {
  IconInfoCircle,
  IconListCheck,
  IconCode,
  IconTrophy,
  IconClock,
  IconUsers,
  IconTag,
  IconAward,
  IconCalendarTime,
  IconClipboardList,
} from '@tabler/icons-react';
import {
  getContest,
  getContestProblems,
  getContestSubmissions,
  getContestRankings,
  getContestClarifications,
  joinContest,
} from '../lib/api/contests';
import { useAuth } from '../context/AuthContext';
import { contests as mockContests, contestDetails as mockContestDetails } from '../lib/api/mockData';

// Format date to match DMOJ format: "Oct 6, 2025, 23:00"
function formatContestDate(dateString) {
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy, HH:mm');
  } catch {
    return dateString;
  }
}

// Format window duration: "03:00 window"
function formatWindowDuration(hours) {
  if (!hours) return '';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} window`;
}

// Get contest status
function getContestStatus(contest) {
  if (!contest) return 'unknown';
  const now = new Date();
  const start = contest.start_time ? new Date(contest.start_time) : null;
  const end = contest.end_time ? new Date(contest.end_time) : null;

  if (start && now < start) return 'upcoming';
  if (end && now > end) return 'ended';
  if (start && end && now >= start && now <= end) return 'running';
  return 'unknown';
}

export default function ContestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [clarifications, setClarifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submissionFilter, setSubmissionFilter] = useState({ problem: 'all', language: 'all', status: 'all' });

  const getMockContest = useCallback((contestId) => {
    const detail = mockContestDetails[contestId];
    if (detail) return detail;
    const summary = mockContests.find((c) => c.id === contestId);
    if (!summary) return null;
    return {
      id: summary.id,
      name: summary.name,
      format: summary.format,
      type: summary.type,
      start_time: summary.startTime,
      end_time: summary.endTime,
      time_limit: summary.timeLimitHours,
      tags: summary.tags,
      short_description: summary.shortDescription,
      status: summary.status,
      problems: [],
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const fallback = getMockContest(id);
    getContest(id)
      .then((res) => {
        if (res && Object.keys(res).length) {
          setContest(res);
        } else {
          setContest(fallback);
        }
      })
      .catch(() => setContest(fallback))
      .finally(() => setLoading(false));
  }, [getMockContest, id]);

  useEffect(() => {
    if (!contest || !id) return;

    // Load problems
    const fallbackProblems = (mockContestDetails[id]?.problems || []).map((title, index) => ({
      id: `${id}-p${index + 1}`,
      title,
      index: index + 1,
    }));
    getContestProblems(id)
      .then((res) => {
        const list = res?.problems || [];
        setProblems(list.length ? list : fallbackProblems);
      })
      .catch(() => setProblems(fallbackProblems));

    // Load clarifications
    getContestClarifications(id)
      .then((res) => setClarifications(res.clarifications || []))
      .catch(() => setClarifications([]));
  }, [contest, id]);

  useEffect(() => {
    if (!contest || !id || activeTab !== 'submissions') return;

    // Load user's submissions
    getContestSubmissions(id, submissionFilter)
      .then((res) => setSubmissions(res.submissions || []))
      .catch(() => setSubmissions([]));
  }, [contest, id, activeTab, submissionFilter]);

  useEffect(() => {
    if (!contest || !id || activeTab !== 'rankings') return;

    const status = getContestStatus(contest);
    // Only load rankings if contest has ended or is running (depending on contest settings)
    if (status === 'ended' || status === 'running') {
      getContestRankings(id)
        .then((res) => setRankings(res.rankings || []))
        .catch(() => setRankings([]));
    }
  }, [contest, id, activeTab]);

  const status = getContestStatus(contest);
  const statusColors = {
    upcoming: 'blue',
    running: 'green',
    ended: 'gray',
    unknown: 'gray',
  };
  const statusLabels = {
    upcoming: 'Upcoming',
    running: 'Running',
    ended: 'Ended',
    unknown: 'Unknown',
  };

  const isParticipating = contest?.is_participating || false;
  const showRankings = status === 'ended' || status === 'running';
  const contestTags = contest?.tags || [];
  const shortDescription = contest?.short_description || contest?.description;
  const scoreboardFreezeAt = contest?.scoreboardFreezeAt || contest?.scoreboard_freeze_at;
  const freezeLabel = scoreboardFreezeAt ? formatContestDate(scoreboardFreezeAt) : 'No freeze';
  const durationLabel = contest?.time_limit
    ? formatWindowDuration(contest.time_limit)
    : contest?.duration
      ? `${contest.duration}h window`
      : 'Flexible window';
  const contestRules = useMemo(() => {
    if (!contest?.rules) return [];
    return Array.isArray(contest.rules) ? contest.rules : [contest.rules];
  }, [contest]);
  const contestPrizes = useMemo(() => {
    if (!contest?.prizes) return [];
    return Array.isArray(contest.prizes) ? contest.prizes : [contest.prizes];
  }, [contest]);

  const handleJoin = async (isVirtual = false) => {
    if (!contest || !user) return;
    try {
      await joinContest(contest.id, isVirtual);
      // Refresh contest data
      const updated = await getContest(id);
      setContest(updated);
    } catch (error) {
      console.error('Failed to join contest:', error);
    }
  };

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
        <Breadcrumbs mb="sm">
          <Anchor component={Link} to="/contests">Contests</Anchor>
          <Text c="dimmed">Not found</Text>
        </Breadcrumbs>
        <Title order={2}>Contest not found</Title>
        <Text c="dimmed" mt="xs">We couldn't find this contest. Please go back to Contests.</Text>
      </Box>
    );
  }

  return (
    <Box p="md" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Breadcrumbs mb="sm">
        <Anchor component={Link} to="/contests">Contests</Anchor>
        <Text c="dimmed">{contest.name}</Text>
      </Breadcrumbs>

      {/* Header */}
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
              <Button onClick={() => handleJoin(false)}>Join</Button>
            )}
            {status === 'ended' && (
              <Button variant="light" onClick={() => handleJoin(true)}>
                Virtual Join
              </Button>
            )}
          </Group>
        )}
      </Group>

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
            <Paper withBorder radius="md" p="md" style={{ flex: 1, minWidth: 280 }}>
              <Group gap="sm" mb="sm">
                <ThemeIcon variant="light" radius="md"><IconClipboardList size={16} /></ThemeIcon>
                <Text fw={600}>Rules</Text>
              </Group>
              <Stack gap={4}>
                {contestRules.map((rule, idx) => (
                  <Text key={idx} size="sm">• {rule}</Text>
                ))}
              </Stack>
            </Paper>
          )}
          {contestPrizes.length > 0 && (
            <Paper withBorder radius="md" p="md" style={{ flex: 1, minWidth: 280 }}>
              <Group gap="sm" mb="sm">
                <ThemeIcon variant="light" radius="md"><IconAward size={16} /></ThemeIcon>
                <Text fw={600}>Prizes</Text>
              </Group>
              <Stack gap={4}>
                {contestPrizes.map((prize, idx) => (
                  <Text key={idx} size="sm">• {prize}</Text>
                ))}
              </Stack>
            </Paper>
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

        {/* Info Tab */}
        <Tabs.Panel value="info" pt="md">
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
        </Tabs.Panel>

        {/* Problems Tab */}
        <Tabs.Panel value="problems" pt="md">
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
                        <Group gap="xs">
                          <Text size="sm" fw={500}>
                            {String.fromCharCode(65 + index)}. {problem.name || problem.title}
                          </Text>
                          {problem.code && (
                            <Text size="xs" c="dimmed">
                              ({problem.code})
                            </Text>
                          )}
                        </Group>
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
        </Tabs.Panel>

        {/* Submissions Tab */}
        <Tabs.Panel value="submissions" pt="md">
          {!user ? (
            <Paper withBorder p="md">
              <Text size="sm" c="dimmed" ta="center">
                Please log in to view your submissions.
              </Text>
            </Paper>
          ) : (
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
          )}
        </Tabs.Panel>

        {/* Rankings Tab */}
        <Tabs.Panel value="rankings" pt="md">
          {!showRankings ? (
            <Paper withBorder p="md">
              <Text size="sm" c="dimmed" ta="center">
                Rankings will be available after the contest ends.
              </Text>
            </Paper>
          ) : (
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
          )}
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}
