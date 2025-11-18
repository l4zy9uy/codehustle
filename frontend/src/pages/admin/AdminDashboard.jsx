import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  Modal,
  MultiSelect,
  Paper,
  Progress,
  RingProgress,
  ScrollArea,
  Select,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconArrowDownRight,
  IconArrowUpRight,
  IconArrowsSort,
  IconChevronRight,
  IconPencil,
  IconPin,
  IconPlus,
  IconRefresh,
  IconShieldCheck,
  IconSearch,
  IconSend,
  IconSparkles,
  IconSpeakerphone,
  IconTrash,
  IconUpload,
  IconUserPlus,
} from '@tabler/icons-react';
import { format, formatDistanceToNow } from 'date-fns';
import { getAdminDashboard } from '../../lib/api/admin';
import { useNavigate } from 'react-router-dom';
import { createAnnouncement, deleteAnnouncement, getAnnouncements, updateAnnouncement } from '../../lib/api/announcements';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '@mantine/tiptap/styles.css';
import { RichTextEditor, Link as RteLink } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';

const severityColor = {
  high: 'red',
  medium: 'yellow',
  low: 'gray',
};

const announcementStatusColor = {
  published: 'teal',
  scheduled: 'yellow',
  draft: 'gray',
  archived: 'red',
};

const audienceLabels = {
  global: 'All learners',
  course: 'Course cohort',
  program: 'Program / track',
  cohort: 'Custom cohort',
};

const audienceOptions = [
  { value: 'global', label: 'All learners' },
  { value: 'course', label: 'Course cohort' },
  { value: 'program', label: 'Program / track' },
  { value: 'cohort', label: 'Custom cohort' },
];

const channelOptions = [
  { value: 'web', label: 'Web' },
  { value: 'email', label: 'Email' },
  { value: 'push', label: 'Push' },
];

const defaultAnnouncementForm = {
  title: '',
  snippet: '',
  content: '',
  author: '',
  audience: 'global',
  targetsInput: '',
  channels: ['web'],
  status: 'draft',
  publishAt: '',
  pinned: false,
};

const toInputDateValue = (isoValue) => {
  if (!isoValue) return '';
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const fromInputDateValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshedAt, setRefreshedAt] = useState(null);
  const sectionLinks = useMemo(() => ([
    { id: 'admin-overview', label: 'Overview', description: 'Platform pulse and headline metrics.' },
    { id: 'admin-moderation', label: 'Moderation queue', description: 'Investigate reports and requests.' },
    { id: 'admin-judge', label: 'Judge & cohorts', description: 'Track infrastructure load and onboarding.' },
    { id: 'admin-contests', label: 'Contest ops', description: 'Monitor live contests and scoreboard freezes.' },
    { id: 'admin-announcements', label: 'Announcements', description: 'Compose, schedule, and pin broadcast notices.' },
    { id: 'admin-usage', label: 'Usage by track', description: 'See where learners spend time.' },
    { id: 'admin-access', label: 'Access requests', description: 'Handle organization and lecturer access.' },
    { id: 'admin-problems', label: 'Problem pipeline', description: 'Review author handoffs before publishing.' },
    { id: 'admin-submissions', label: 'Submission feed', description: 'Watch latest verdicts for judging issues.' },
    { id: 'admin-bulk', label: 'Bulk import', description: 'Upload CSV rosters and download generated credentials.' },
    { id: 'admin-activity', label: 'Recent activity', description: 'Audit latest admin actions.' },
    { id: 'admin-quick-actions', label: 'Quick actions', description: 'Shortcuts for common workflows.' },
  ]), []);
  const [activeSection, setActiveSection] = useState('admin-overview');
  const [announcementsItems, setAnnouncementsItems] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState(null);
  const [announcementFilter, setAnnouncementFilter] = useState('all');
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerSaving, setComposerSaving] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [composerValues, setComposerValues] = useState(defaultAnnouncementForm);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await getAdminDashboard();
      setData(payload);
      setRefreshedAt(new Date());
    } catch (err) {
      setError(err?.message || 'Unable to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    setAnnouncementsError(null);
    try {
      const payload = await getAnnouncements({ scope: 'admin' });
      setAnnouncementsItems(payload.items || []);
    } catch (err) {
      setAnnouncementsError(err?.message || 'Unable to load announcements');
    } finally {
      setAnnouncementsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleDownloadTemplate = useCallback(() => {
    const csv = 'email,student_id,name,username,password\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'bulk-import-template.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }, []);

  const lastUpdatedText = useMemo(() => {
    if (!refreshedAt) return 'Never';
    return formatDistanceToNow(refreshedAt, { addSuffix: true });
  }, [refreshedAt]);

  const stats = data?.stats || [];
  const moderationQueue = data?.moderationQueue || [];
  const cohorts = data?.onboardingCohorts || [];
  const accessRequests = data?.accessRequests || [];
  const activity = data?.recentActivity || [];
  const usage = data?.usageBreakdown || [];
  const contestOps = data?.contestOps || [];
  const problemPipeline = data?.problemPipeline || [];
  const submissionFeed = data?.submissionFeed || [];
  const systemStatus = data?.systemStatus;
  const filteredAnnouncements = useMemo(() => {
    const query = announcementSearch.trim().toLowerCase();
    return announcementsItems.filter((item) => {
      const status = (item.status || 'draft').toLowerCase();
      const matchesStatus = announcementFilter === 'all' || status === announcementFilter;
      const haystack = [
        item.title,
        item.snippet,
        Array.isArray(item.author) ? item.author.join(' ') : item.author,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [announcementsItems, announcementFilter, announcementSearch]);

  const sortedAnnouncements = useMemo(() => {
    const list = [...filteredAnnouncements];
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const aDate = new Date(a.publishAt || a.date || 0).getTime();
      const bDate = new Date(b.publishAt || b.date || 0).getTime();
      return bDate - aDate;
    });
  }, [filteredAnnouncements]);

  const announcementStats = useMemo(() => {
    return announcementsItems.reduce((acc, item) => {
      const key = (item.status || 'draft').toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [announcementsItems]);

  useEffect(() => {
    if (!announcementsItems.length) {
      setSelectedAnnouncement(null);
      return;
    }
    setSelectedAnnouncement((prev) => {
      if (!prev) return announcementsItems[0];
      const match = announcementsItems.find((item) => item.id === prev.id);
      return match || announcementsItems[0];
    });
  }, [announcementsItems]);

  useEffect(() => {
    if (!selectedAnnouncement) return;
    const exists = filteredAnnouncements.some((item) => item.id === selectedAnnouncement.id);
    if (!exists) {
      setSelectedAnnouncement(filteredAnnouncements[0] || null);
    }
  }, [filteredAnnouncements, selectedAnnouncement]);

  const resetComposer = () => {
    setComposerValues({
      ...defaultAnnouncementForm,
      author: 'Platform Ops',
    });
    setEditingAnnouncement(null);
  };

  const openComposer = (announcement = null) => {
    if (announcement) {
      setComposerValues({
        title: announcement.title || '',
        snippet: announcement.snippet || '',
        content: announcement.content || '',
        author: Array.isArray(announcement.author) ? announcement.author.join(', ') : (announcement.author || 'Platform Ops'),
        audience: announcement.audience || 'global',
        targetsInput: Array.isArray(announcement.targets) ? announcement.targets.join(', ') : '',
        channels: announcement.channels?.length ? announcement.channels : ['web'],
        status: announcement.status || 'draft',
        publishAt: toInputDateValue(announcement.publishAt || announcement.date),
        pinned: !!announcement.pinned,
      });
      setEditingAnnouncement(announcement);
    } else {
      resetComposer();
    }
    setComposerOpen(true);
  };

  const handleAnnouncementUpdate = async (announcement, updates) => {
    if (!announcement) return;
    try {
      const updated = await updateAnnouncement(announcement.id, updates);
      setAnnouncementsItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedAnnouncement((current) => (current?.id === updated.id ? updated : current));
    } catch (err) {
      setAnnouncementsError(err?.message || 'Unable to update announcement');
    }
  };

  const handleStatusToggle = (announcement) => {
    if (!announcement) return;
    const nextStatus = announcement.status === 'published' ? 'draft' : 'published';
    const updates = { status: nextStatus };
    if (nextStatus === 'published') {
      updates.publishAt = new Date().toISOString();
    }
    handleAnnouncementUpdate(announcement, updates);
  };

  const handlePinToggle = (announcement) => {
    if (!announcement) return;
    handleAnnouncementUpdate(announcement, { pinned: !announcement.pinned });
  };

  const handlePublishNow = (announcement) => {
    if (!announcement) return;
    handleAnnouncementUpdate(announcement, { status: 'published', publishAt: new Date().toISOString() });
  };

  const handleDeleteAnnouncement = async (announcement) => {
    if (!announcement) return;
    const confirmed = typeof window !== 'undefined'
      ? window.confirm(`Delete "${announcement.title}"? This cannot be undone.`)
      : true;
    if (!confirmed) return;
    try {
      await deleteAnnouncement(announcement.id);
      setAnnouncementsItems((prev) => prev.filter((item) => item.id !== announcement.id));
      setSelectedAnnouncement((current) => (current?.id === announcement.id ? null : current));
    } catch (err) {
      setAnnouncementsError(err?.message || 'Unable to delete announcement');
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      RteLink,
      Placeholder.configure({ placeholder: 'Write an announcement... Use the toolbar for formatting.' }),
    ],
    content: composerValues.content || '',
    onUpdate: ({ editor: ed }) => {
      setComposerValues((prev) => ({ ...prev, content: ed.getHTML() }));
    },
  });

  useEffect(() => {
    if (editor && composerOpen) {
      editor.commands.setContent(composerValues.content || '', false);
    }
  }, [composerOpen, composerValues.content, editor]);

  const handleComposerSubmit = async () => {
    setComposerSaving(true);
    const parsedTargets = composerValues.targetsInput
      ? composerValues.targetsInput.split(',').map((item) => item.trim()).filter(Boolean)
      : [];
    const payload = {
      title: composerValues.title,
      snippet: composerValues.snippet,
      content: composerValues.content,
      author: composerValues.author?.trim() || 'Platform Ops',
      audience: composerValues.audience,
      targets: parsedTargets,
      channels: composerValues.channels?.length ? composerValues.channels : ['web'],
      status: composerValues.status || 'draft',
      publishAt: fromInputDateValue(composerValues.publishAt) || undefined,
      pinned: composerValues.pinned,
    };
    try {
      let saved;
      if (editingAnnouncement) {
        saved = await updateAnnouncement(editingAnnouncement.id, payload);
        setAnnouncementsItems((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
      } else {
        saved = await createAnnouncement(payload);
        setAnnouncementsItems((prev) => [saved, ...prev]);
      }
      setSelectedAnnouncement(saved);
      setComposerOpen(false);
      resetComposer();
    } catch (err) {
      setAnnouncementsError(err?.message || 'Unable to save announcement');
    } finally {
      setComposerSaving(false);
    }
  };

  const handleComposerClose = () => {
    setComposerOpen(false);
    resetComposer();
  };

  const renderOverview = () => (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {(loading && !stats.length ? Array.from({ length: 4 }) : stats).map((stat, idx) => (
          <Paper key={stat?.id || idx} withBorder radius="md" p="md">
            {loading && !stats.length ? (
              <Stack gap="xs">
                <Skeleton height={12} width="40%" />
                <Skeleton height={24} width="70%" />
                <Skeleton height={10} width="60%" />
              </Stack>
            ) : (
              <Stack gap={6}>
                <Text size="sm" c="dimmed">{stat.label}</Text>
                <Group justify="space-between" align="flex-end">
                  <Text size="lg" fw={600}>{stat.value}</Text>
                  <Badge
                    variant="light"
                    color={(stat.change ?? 0) >= 0 ? 'teal' : 'red'}
                    leftSection={(stat.change ?? 0) >= 0 ? <IconArrowUpRight size={14} /> : <IconArrowDownRight size={14} />}
                  >
                    {(stat.change > 0 ? '+' : '') + stat.change}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed">{stat.helper}</Text>
              </Stack>
            )}
          </Paper>
        ))}
      </SimpleGrid>
      <Text size="sm" c="dimmed">Metrics refresh every few minutes from system telemetry.</Text>
    </Stack>
  );

  const renderModeration = () => (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Moderation queue</Text>
        <Button size="xs" variant="subtle" leftSection={<IconArrowsSort size={14} />}>Prioritize</Button>
      </Group>
      <ScrollArea h={320} type="never">
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Item</Table.Th>
              <Table.Th>User</Table.Th>
              <Table.Th>Problem</Table.Th>
              <Table.Th>Received</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(loading && !moderationQueue.length ? Array.from({ length: 3 }) : moderationQueue).map((item, idx) => (
              <Table.Tr key={item?.id || idx}>
                {loading && !moderationQueue.length ? (
                  <Table.Td colSpan={4}>
                    <Skeleton height={18} />
                  </Table.Td>
                ) : (
                  <>
                    <Table.Td>
                      <Group gap="xs">
                        <Badge color={severityColor[item.severity] || 'gray'} variant="light">
                          {item.severity}
                        </Badge>
                        <Text size="sm">{item.issue}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>{item.user}</Table.Td>
                    <Table.Td>{item.problem}</Table.Td>
                    <Table.Td>{formatDistanceToNow(new Date(item.reportedAt), { addSuffix: true })}</Table.Td>
                  </>
                )}
              </Table.Tr>
            ))}
            {!loading && moderationQueue.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text size="sm" c="dimmed">No items pending review.</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Paper>
  );

  const renderJudge = () => (
    <Stack gap="md">
      <Paper withBorder radius="md" p="md">
        <Group justify="space-between" mb="sm">
          <Text fw={600}>Judge load</Text>
          <ThemeIcon color="blue" size="sm" variant="light">
            <IconShieldCheck size={14} />
          </ThemeIcon>
        </Group>
        {systemStatus ? (
          <Stack gap="sm">
            <Group gap="lg">
              <RingProgress
                size={120}
                sections={[{ value: Math.min(systemStatus.uptime, 100), color: 'teal' }]}
                label={<Text ta="center" fw={600}>{systemStatus.uptime}% uptime</Text>}
              />
              <Stack gap={4} style={{ flex: 1 }}>
                <Text size="sm" c="dimmed">Judge queue</Text>
                <Text fw={600}>{(systemStatus.judgeQueueMs / 1000).toFixed(2)} s avg</Text>
                <Text size="xs" c="dimmed">{systemStatus.tasksQueued} tasks waiting</Text>
                <Text size="sm" c="dimmed" style={{ marginTop: 'var(--mantine-spacing-xs)' }}>Incidents open: <Text span fw={600}>{systemStatus.incidentsOpen}</Text></Text>
              </Stack>
            </Group>
            <Stack gap={6}>
              {systemStatus.checks?.map((check) => (
                <Group key={check.id} justify="space-between">
                  <Group gap="xs">
                    <Badge color={check.status === 'operational' ? 'teal' : 'yellow'} variant="light" radius="sm">
                      {check.status}
                    </Badge>
                    <Text size="sm">{check.label}</Text>
                  </Group>
                  <Text size="sm" c="dimmed">{check.detail}</Text>
                </Group>
              ))}
            </Stack>
          </Stack>
        ) : (
          <Skeleton height={160} />
        )}
      </Paper>
      <Paper withBorder radius="md" p="md">
        <Text fw={600} mb="sm">Onboarding cohorts</Text>
        <Stack gap="xs">
          {cohorts.map((cohort) => (
            <Card key={cohort.id} withBorder radius="md" padding="md">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text fw={600}>{cohort.course}</Text>
                  <Text size="xs" c="dimmed">Lead: {cohort.owner}</Text>
                </div>
                <Badge>{cohort.size} learners</Badge>
              </Group>
              <Group gap="xs" mt={6}>
                <Badge size="xs" variant="light">{cohort.status}</Badge>
                <Text size="xs" c="dimmed">Due {format(new Date(cohort.dueDate), 'MMM d')}</Text>
              </Group>
            </Card>
          ))}
          {!cohorts.length && !loading && (
            <Text size="sm" c="dimmed">No onboarding cohorts pending.</Text>
          )}
        </Stack>
      </Paper>
    </Stack>
  );

  const renderUsage = () => (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Usage by track</Text>
        <IconSparkles size={18} color="var(--mantine-color-blue-6)" />
      </Group>
      <Stack gap="sm">
        {usage.map((item) => (
          <div key={item.id}>
            <Group justify="space-between" mb={4}>
              <Text size="sm">{item.label}</Text>
              <Text size="sm" c="dimmed">{item.percent}%</Text>
            </Group>
            <Progress value={item.percent} color="blue" radius="lg" size="sm" />
          </div>
        ))}
        {!usage.length && <Skeleton height={120} />}
      </Stack>
    </Paper>
  );

  const contestStatusColor = {
    live: 'teal',
    upcoming: 'blue',
    draft: 'gray',
  };

  const renderContests = () => (
    <Stack gap="md">
      {contestOps.map((contest) => (
        <Paper key={contest.id} withBorder radius="md" p="md">
          <Group justify="space-between" align="flex-start">
            <div>
              <Group gap="xs">
                <Text fw={600}>{contest.name}</Text>
                <Badge color={contestStatusColor[contest.status] || 'gray'} variant="light" radius="sm">
                  {contest.status}
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">{contest.phase}</Text>
            </div>
            <Stack gap={0} align="flex-end">
              <Text size="sm" c="dimmed">Participants</Text>
              <Text fw={600}>{contest.participants}</Text>
              {contest.flagged > 0 && (
                <Text size="xs" c="red">{contest.flagged} flagged submissions</Text>
              )}
            </Stack>
          </Group>
          <Group gap="sm" mt="sm" wrap="wrap">
            <Button size="xs" onClick={() => navigate(contest.href || `/contests/${contest.id}`)}>
              Open dashboard
            </Button>
            {contest.status === 'live' && (
              <Button size="xs" variant="light" color="orange">
                Freeze scoreboard now
              </Button>
            )}
            {contest.status === 'draft' && (
              <Button size="xs" variant="light" disabled>
                Request approvals
              </Button>
            )}
          </Group>
        </Paper>
      ))}
      {!contestOps.length && !loading && (
        <Text size="sm" c="dimmed">No contests to show.</Text>
      )}
    </Stack>
  );

  const renderAnnouncements = () => (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
        <Group gap="xs">
          <ThemeIcon variant="light" color="indigo" radius="md">
            <IconSpeakerphone size={16} />
          </ThemeIcon>
          <Stack gap={2}>
            <Text fw={600}>Announcement composer</Text>
            <Text size="sm" c="dimmed">Draft, schedule, and pin updates that appear on the learner dashboard.</Text>
          </Stack>
        </Group>
        <Group gap="xs">
          <Button
            size="xs"
            variant="default"
            leftSection={<IconRefresh size={14} />}
            loading={announcementsLoading}
            onClick={fetchAnnouncements}
          >
            Refresh
          </Button>
          <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => openComposer()}>
            Compose
          </Button>
        </Group>
      </Group>

      {announcementsError && (
        <Alert color="red" title="Announcements">
          <Text size="sm">{announcementsError}</Text>
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        {[
          { key: 'published', label: 'Published' },
          { key: 'scheduled', label: 'Scheduled' },
          { key: 'draft', label: 'Drafts' },
        ].map((metric) => (
          <Paper key={metric.key} withBorder radius="md" p="md">
            <Text size="sm" c="dimmed">{metric.label}</Text>
            {announcementsLoading ? (
              <Skeleton height={32} mt="sm" />
            ) : (
              <Group justify="space-between" align="center" mt="xs">
                <Text fw={700} size="xl">{announcementStats[metric.key] || 0}</Text>
                <Badge color={announcementStatusColor[metric.key] || 'gray'} variant="light">
                  {metric.label}
                </Badge>
              </Group>
            )}
          </Paper>
        ))}
      </SimpleGrid>

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Stack gap="sm">
            <Group gap="sm" align="center" justify="space-between" wrap="wrap">
              <SegmentedControl
                value={announcementFilter}
                onChange={setAnnouncementFilter}
                data={[
                  { label: 'All', value: 'all' },
                  { label: 'Published', value: 'published' },
                  { label: 'Scheduled', value: 'scheduled' },
                  { label: 'Drafts', value: 'draft' },
                ]}
              />
              <TextInput
                placeholder="Search title or author"
                leftSection={<IconSearch size={14} />}
                value={announcementSearch}
                onChange={(event) => setAnnouncementSearch(event.currentTarget.value)}
                style={{ flexGrow: 1 }}
              />
            </Group>
            <ScrollArea h={360} type="never">
              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: '32%' }}>Announcement</Table.Th>
                    <Table.Th style={{ width: '22%' }}>Audience</Table.Th>
                    <Table.Th style={{ width: '24%' }}>Publish</Table.Th>
                    <Table.Th style={{ width: '12%' }}>Status</Table.Th>
                    <Table.Th style={{ width: '10%' }} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {announcementsLoading && !sortedAnnouncements.length
                    ? Array.from({ length: 3 }).map((_, idx) => (
                      <Table.Tr key={idx}>
                        <Table.Td colSpan={5}>
                          <Skeleton height={40} />
                        </Table.Td>
                      </Table.Tr>
                    ))
                    : null}
                  {!announcementsLoading && sortedAnnouncements.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={5}>
                        <Text size="sm" c="dimmed" ta="center">No announcements match the current filters.</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                  {sortedAnnouncements.map((announcement) => {
                    const publishDate = new Date(announcement.publishAt || announcement.date || 0);
                    const hasDate = !Number.isNaN(publishDate.getTime());
                    return (
                      <Table.Tr
                        key={announcement.id}
                        onClick={() => setSelectedAnnouncement(announcement)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Table.Td>
                          <Stack gap={4}>
                            <Group gap="xs">
                              <Text fw={600} size="sm">{announcement.title}</Text>
                              {announcement.pinned && (
                                <Badge size="xs" color="pink" variant="light" leftSection={<IconPin size={12} />}>
                                  Pinned
                                </Badge>
                              )}
                            </Group>
                            <Text size="xs" c="dimmed" lineClamp={2}>
                              {announcement.snippet || 'No summary provided yet.'}
                            </Text>
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <Stack gap={4}>
                            <Badge size="xs" variant="light">
                              {audienceLabels[announcement.audience] || 'All learners'}
                            </Badge>
                            <Text size="xs" c="dimmed">
                              {Array.isArray(announcement.targets) && announcement.targets.length
                                ? announcement.targets.join(', ')
                                : 'All cohorts'}
                            </Text>
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          {hasDate ? (
                            <Stack gap={2}>
                              <Text size="sm">{format(publishDate, 'MMM d, HH:mm')}</Text>
                              <Text size="xs" c="dimmed">
                                {formatDistanceToNow(publishDate, { addSuffix: true })}
                              </Text>
                            </Stack>
                          ) : (
                            <Text size="sm" c="dimmed">Not scheduled</Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Badge color={announcementStatusColor[announcement.status] || 'gray'} variant="light">
                            {announcement.status || 'draft'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4} justify="flex-end">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              title="Edit"
                              onClick={(event) => {
                                event.stopPropagation();
                                openComposer(announcement);
                              }}
                            >
                              <IconPencil size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="subtle"
                              color="teal"
                              title={announcement.status === 'published' ? 'Move to draft' : 'Publish now'}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleStatusToggle(announcement);
                              }}
                            >
                              <IconSend size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              title="Delete"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteAnnouncement(announcement);
                              }}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper withBorder radius="md" p="md" h="100%">
            {selectedAnnouncement ? (
              <Stack gap="sm" h="100%">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Group gap="xs">
                      <Text fw={600}>{selectedAnnouncement.title}</Text>
                      {selectedAnnouncement.pinned && (
                        <Badge size="xs" color="pink" variant="light" leftSection={<IconPin size={12} />}>
                          Pinned
                        </Badge>
                      )}
                    </Group>
                    <Text size="xs" c="dimmed">
                      Audience: {audienceLabels[selectedAnnouncement.audience] || 'All learners'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Targets: {Array.isArray(selectedAnnouncement.targets) && selectedAnnouncement.targets.length
                        ? selectedAnnouncement.targets.join(', ')
                        : 'All cohorts'}
                    </Text>
                  </div>
                  <Badge color={announcementStatusColor[selectedAnnouncement.status] || 'gray'} variant="light">
                    {selectedAnnouncement.status || 'draft'}
                  </Badge>
                </Group>
                <Group gap="xs">
                  {(selectedAnnouncement.channels || ['web']).map((channel) => (
                    <Badge key={channel} size="xs" variant="light">{channel}</Badge>
                  ))}
                </Group>
                <Divider />
                <ScrollArea style={{ flex: 1 }} type="auto">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedAnnouncement.content || '*No content yet.*'}
                  </ReactMarkdown>
                </ScrollArea>
                <Group gap="xs" justify="flex-end">
                  <Button size="xs" variant="default" onClick={() => handlePinToggle(selectedAnnouncement)}>
                    {selectedAnnouncement.pinned ? 'Unpin' : 'Pin'}
                  </Button>
                  <Button size="xs" variant="light" onClick={() => openComposer(selectedAnnouncement)}>
                    Edit
                  </Button>
                  {selectedAnnouncement.status !== 'published' && (
                    <Button
                      size="xs"
                      color="teal"
                      leftSection={<IconSend size={14} />}
                      onClick={() => handlePublishNow(selectedAnnouncement)}
                    >
                      Publish now
                    </Button>
                  )}
                  <Button size="xs" variant="subtle" color="red" onClick={() => handleDeleteAnnouncement(selectedAnnouncement)}>
                    Delete
                  </Button>
                </Group>
              </Stack>
            ) : (
              <Stack align="center" gap="xs" justify="center" style={{ minHeight: 220 }}>
                <ThemeIcon size="xl" radius="xl" variant="light" color="gray">
                  <IconSpeakerphone size={22} />
                </ThemeIcon>
                <Text size="sm" c="dimmed">Select an announcement to preview it here.</Text>
              </Stack>
            )}
          </Paper>
        </Grid.Col>
      </Grid>

      <Modal
        opened={composerOpen}
        onClose={handleComposerClose}
        title={editingAnnouncement ? 'Edit announcement' : 'Compose announcement'}
        size="lg"
        centered
      >
        <Stack gap="sm">
          <TextInput
            label="Title"
            value={composerValues.title}
            onChange={(event) => setComposerValues((prev) => ({ ...prev, title: event.currentTarget.value }))}
            required
          />
          <Group grow>
            <TextInput
              label="Author"
              value={composerValues.author}
              onChange={(event) => setComposerValues((prev) => ({ ...prev, author: event.currentTarget.value }))}
            />
            <Select
              label="Status"
              data={[
                { value: 'draft', label: 'Draft' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'published', label: 'Published' },
              ]}
              value={composerValues.status || 'draft'}
              onChange={(value) => setComposerValues((prev) => ({ ...prev, status: value || 'draft' }))}
            />
          </Group>
          <TextInput
            label="Snippet"
            description="Short summary that appears on the feed."
            value={composerValues.snippet}
            onChange={(event) => setComposerValues((prev) => ({ ...prev, snippet: event.currentTarget.value }))}
          />
          <Stack gap="xs">
            <div style={{ flex: 1 }}>
              <Text size="xs" c="dimmed" mb={4}>Rich text</Text>
              {editor ? (
                <RichTextEditor editor={editor} style={{ zIndex: 2 }}>
                  <RichTextEditor.Toolbar sticky stickyOffset={4}>
                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.Bold />
                      <RichTextEditor.Italic />
                      <RichTextEditor.Underline />
                      <RichTextEditor.Strikethrough />
                    </RichTextEditor.ControlsGroup>
                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.H1 />
                      <RichTextEditor.H2 />
                      <RichTextEditor.H3 />
                    </RichTextEditor.ControlsGroup>
                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.BulletList />
                      <RichTextEditor.OrderedList />
                    </RichTextEditor.ControlsGroup>
                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.Link />
                      <RichTextEditor.Unlink />
                    </RichTextEditor.ControlsGroup>
                  </RichTextEditor.Toolbar>
                  <RichTextEditor.Content mih={260} />
                </RichTextEditor>
              ) : (
                <Skeleton height={300} radius="md" />
              )}
            </div>
            <Paper withBorder radius="md" p="sm" bg="var(--mantine-color-gray-0)">
              <Text size="sm" fw={600} mb={6}>Live preview</Text>
              <div dangerouslySetInnerHTML={{ __html: composerValues.content || '<em>Start typing to preview...</em>' }} />
            </Paper>
          </Stack>
          <Group grow>
            <Select
              label="Audience"
              data={audienceOptions}
              value={composerValues.audience}
              onChange={(value) => setComposerValues((prev) => ({ ...prev, audience: value || 'global' }))}
            />
            <TextInput
              label="Targets"
              description="Comma separated (e.g., CS301, ICPC Elite)"
              value={composerValues.targetsInput}
              onChange={(event) => setComposerValues((prev) => ({ ...prev, targetsInput: event.currentTarget.value }))}
            />
          </Group>
          <MultiSelect
            label="Channels"
            data={channelOptions}
            value={composerValues.channels || []}
            onChange={(value) => setComposerValues((prev) => ({ ...prev, channels: value }))}
            searchable
          />
          <Group grow>
            <TextInput
              label="Publish at"
              type="datetime-local"
              value={composerValues.publishAt}
              onChange={(event) => setComposerValues((prev) => ({ ...prev, publishAt: event.currentTarget.value }))}
            />
            <Switch
              label="Pin to dashboard"
              checked={composerValues.pinned}
              onChange={(event) => setComposerValues((prev) => ({ ...prev, pinned: event.currentTarget.checked }))}
              mt="lg"
            />
          </Group>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleComposerClose}>
              Cancel
            </Button>
            <Button onClick={handleComposerSubmit} loading={composerSaving}>
              Save announcement
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );

  const renderProblemPipeline = () => (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Problem pipeline</Text>
        <Button size="xs" variant="light" onClick={() => navigate('/problems/new')}>
          New problem
        </Button>
      </Group>
      <ScrollArea h={340} type="never">
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Owner</Table.Th>
              <Table.Th>Difficulty</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Updated</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(loading && !problemPipeline.length ? Array.from({ length: 3 }) : problemPipeline).map((problem, idx) => (
              <Table.Tr key={problem?.id || idx}>
                {loading && !problemPipeline.length ? (
                  <Table.Td colSpan={5}>
                    <Skeleton height={18} />
                  </Table.Td>
                ) : (
                  <>
                    <Table.Td>
                      <Text fw={600}>{problem.title}</Text>
                    </Table.Td>
                    <Table.Td>{problem.owner}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={problem.difficulty === 'Hard' ? 'red' : problem.difficulty === 'Medium' ? 'yellow' : 'teal'}>
                        {problem.difficulty}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{problem.status}</Table.Td>
                    <Table.Td>{formatDistanceToNow(new Date(problem.updatedAt), { addSuffix: true })}</Table.Td>
                  </>
                )}
              </Table.Tr>
            ))}
            {!loading && problemPipeline.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text size="sm" c="dimmed">No problems pending review.</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Paper>
  );

  const verdictColor = {
    AC: 'teal',
    WA: 'red',
    TLE: 'orange',
    CE: 'gray',
  };

  const renderSubmissionFeed = () => (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Latest submissions</Text>
        <Button size="xs" variant="light" onClick={() => navigate('/submissions')}>
          View all
        </Button>
      </Group>
      <ScrollArea h={360} type="auto">
        <Stack gap="sm">
          {(loading && !submissionFeed.length ? Array.from({ length: 4 }) : submissionFeed).map((item, idx) => (
            <Card key={item?.id || idx} withBorder radius="md" padding="sm">
              {loading && !submissionFeed.length ? (
                <Skeleton height={40} />
              ) : (
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text fw={600}>{item.user}</Text>
                    <Text size="sm" c="dimmed">{item.problem}</Text>
                    <Text size="xs" c="dimmed">{formatDistanceToNow(new Date(item.submittedAt), { addSuffix: true })}</Text>
                  </div>
                  <Stack gap={2} align="flex-end">
                    <Badge color={verdictColor[item.verdict] || 'gray'}>{item.verdict}</Badge>
                    <Text size="xs" c="dimmed">{item.language}</Text>
                  </Stack>
                </Group>
              )}
            </Card>
          ))}
        </Stack>
      </ScrollArea>
    </Paper>
  );

  const renderAccess = () => (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Access requests</Text>
        <Button size="xs" variant="light" leftSection={<IconUserPlus size={14} />}>Assign owner</Button>
      </Group>
      <Stack gap="sm">
        {(loading && !accessRequests.length ? Array.from({ length: 2 }) : accessRequests).map((request, idx) => (
          <Paper key={request?.id || idx} withBorder radius="md" p="sm">
            {loading && !accessRequests.length ? (
              <Skeleton height={32} />
            ) : (
              <Stack gap={2}>
                <Group justify="space-between">
                  <Text fw={600}>{request.requester}</Text>
                  <Badge variant="light" color="blue">{request.organization}</Badge>
                </Group>
                <Text size="sm" c="dimmed">{request.reason}</Text>
                <Text size="xs" c="dimmed">Submitted {formatDistanceToNow(new Date(request.submittedAt), { addSuffix: true })}</Text>
              </Stack>
            )}
          </Paper>
        ))}
        {!loading && accessRequests.length === 0 && (
          <Text size="sm" c="dimmed">No new requests.</Text>
        )}
      </Stack>
    </Paper>
  );

  const renderBulkImport = () => (
    <Paper withBorder radius="md" p="md">
      <Stack gap="md">
        <div>
          <Text fw={600}>Bulk account import</Text>
          <Text size="sm" c="dimmed">Upload CSV rosters, map fields, and distribute generated credentials.</Text>
        </div>
        <Stack gap={6}>
          {[
            'Prepare CSV with email and student_id columns (plus optional name, username, password).',
            'Review mappings for each column before generating accounts.',
            'Download the credential CSV and share via a secure channel.',
          ].map((tip, idx) => (
            <Group key={idx} align="flex-start" gap="xs">
              <Badge variant="light" color="blue">{idx + 1}</Badge>
              <Text size="sm">{tip}</Text>
            </Group>
          ))}
        </Stack>
        <Group gap="sm" wrap="wrap">
          <Button leftSection={<IconUpload size={16} />} disabled>
            Open bulk import tool
          </Button>
          <Button variant="light" onClick={handleDownloadTemplate}>
            Download template
          </Button>
        </Group>
        <Text size="xs" c="dimmed">Advanced options like contest scoping live in Admin Settings.</Text>
      </Stack>
    </Paper>
  );

  const renderActivity = () => (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Recent activity</Text>
        <Button size="xs" variant="subtle">View audit log</Button>
      </Group>
      <Stack gap="sm">
        {activity.map((item) => (
          <Group key={item.id} gap="md" align="flex-start">
            <ThemeIcon size="sm" variant="light" color="gray">
              <IconShieldCheck size={12} />
            </ThemeIcon>
            <div>
              <Text size="sm"><Text span fw={600}>{item.actor}</Text> {item.action} <Text span fw={500}>{item.target}</Text></Text>
              <Text size="xs" c="dimmed">{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</Text>
            </div>
          </Group>
        ))}
        {!activity.length && <Text size="sm" c="dimmed">No activity recorded.</Text>}
      </Stack>
    </Paper>
  );

  const renderQuickActions = () => (
    <Paper withBorder radius="md" p="md">
      <Text fw={600} mb="sm">Quick actions</Text>
      <Stack>
        {[{
          label: 'Open announcement composer',
          description: 'Draft a note for upcoming contests.',
        }, {
          label: 'Review pending cohorts',
          description: 'Verify roster uploads and seat counts.',
        }, {
          label: 'Check incident response runbook',
          description: 'Stay ready for degraded services.',
        }].map((action) => (
          <Card key={action.label} withBorder radius="md" padding="sm">
            <Group justify="space-between" align="flex-start">
              <Stack gap={2}>
                <Text fw={600}>{action.label}</Text>
                <Text size="xs" c="dimmed">{action.description}</Text>
              </Stack>
              <ThemeIcon variant="light" color="blue" size="sm">
                <IconChevronRight size={14} />
              </ThemeIcon>
            </Group>
          </Card>
        ))}
      </Stack>
    </Paper>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'admin-moderation':
        return renderModeration();
      case 'admin-judge':
        return renderJudge();
      case 'admin-contests':
        return renderContests();
      case 'admin-announcements':
        return renderAnnouncements();
      case 'admin-usage':
        return renderUsage();
      case 'admin-access':
        return renderAccess();
      case 'admin-problems':
        return renderProblemPipeline();
      case 'admin-submissions':
        return renderSubmissionFeed();
      case 'admin-activity':
        return renderActivity();
      case 'admin-quick-actions':
        return renderQuickActions();
      case 'admin-bulk':
        return renderBulkImport();
      case 'admin-overview':
      default:
        return renderOverview();
    }
  };

  const activeMeta = sectionLinks.find((section) => section.id === activeSection);

  return (
    <Box
      style={{ minHeight: 'calc(100vh - 80px)' }}
    >
      <Stack gap="lg">
        <Group align="flex-start" justify="space-between" wrap="wrap" gap="md">
          <Stack gap={4}>
            <Title order={2}>Admin Control Center</Title>
            <Text c="dimmed">Insight into platform health, moderation, and onboarding queues.</Text>
            <Text size="xs" c="dimmed">Last synced {lastUpdatedText}</Text>
          </Stack>
        </Group>

        {error && (
          <Alert icon={<IconAlertTriangle size={16} />} color="red" title="Unable to load">
            <Group justify="space-between">
              <Text size="sm">{error}</Text>
              <Button size="xs" onClick={fetchDashboard} variant="light">Retry</Button>
            </Group>
          </Alert>
        )}

        <Grid gutter="xl" align="stretch" style={{ minHeight: '100%' }}>
          <Grid.Col span={{ base: 12, md: 3 }} style={{ display: 'flex' }}>
            <Paper withBorder radius="md" p="md" style={{ flex: 1, height: '100%' }}>
              <Stack gap="xs">
                <Text size="sm" fw={600}>Sections</Text>
                {sectionLinks.map((section) => (
                  <Button
                    key={section.id}
                    variant={activeSection === section.id ? 'light' : 'subtle'}
                    color="blue"
                    fullWidth
                    size="compact-sm"
                    justify="space-between"
                    rightSection={<IconChevronRight size={14} />}
                    onClick={() => setActiveSection(section.id)}
                  >
                    {section.label}
                  </Button>
                ))}
              </Stack>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 9 }} style={{ display: 'flex' }}>
            <Paper
              withBorder
              radius="md"
              p="md"
              style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100%' }}
            >
              <Stack gap="sm" style={{ flex: 1 }}>
                <div>
                  <Text fw={700}>{activeMeta?.label}</Text>
                  {activeMeta?.description && (
                    <Text size="sm" c="dimmed">{activeMeta.description}</Text>
                  )}
                </div>
                <ScrollArea style={{ flex: 1 }} type="auto">
                  <Stack gap="lg">
                    {renderSectionContent()}
                  </Stack>
                </ScrollArea>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Stack>
    </Box>
  );
}
