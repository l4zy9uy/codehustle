import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Accordion, Grid, Group, Paper, ScrollArea, Stack, Switch, Text, TextInput, Textarea, PasswordInput, ThemeIcon, Title } from '@mantine/core';
import { IconAlertTriangle, IconArrowsSort, IconSend } from '@tabler/icons-react';
import { format, formatDistanceToNow } from 'date-fns';
import { getAdminDashboard } from '../../lib/api/admin';
import { useNavigate } from 'react-router-dom';
import { createAnnouncement, deleteAnnouncement, getAnnouncements, updateAnnouncement } from '../../lib/api/announcements';
import ContestCreate from './ContestCreate';
import { notifications } from '@mantine/notifications';
import {
  OverviewSection,
  ModerationSection,
  JudgeSection,
  UsageSection,
  ContestsSection,
  AnnouncementsListSection,
  AnnouncementCreateSection,
  AccessSection,
  ProblemsSection,
  SubmissionsSection,
  UserImportSection,
  UserGenerateSection,
  ActivitySection,
  QuickActionsSection,
} from './components/AdminSections';

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
  const tinyMceApiKey = import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshedAt, setRefreshedAt] = useState(null);
  const sectionLinks = useMemo(() => ([
    { id: 'admin-overview', label: 'Overview', description: 'Platform pulse and headline metrics.' },
    { id: 'admin-moderation', label: 'Moderation queue', description: 'Investigate reports and requests.' },
    { id: 'admin-judge', label: 'Judge & cohorts', description: 'Track infrastructure load and onboarding.' },
    { id: 'admin-contests', label: 'Contests', description: 'Monitor and launch programming contests.' },
    { id: 'admin-announcements', label: 'Announcements', description: 'Compose, schedule, and pin broadcast notices.' },
    { id: 'admin-settings', label: 'Settings', description: 'SMTP and web configuration.' },
    { id: 'admin-usage', label: 'Usage by track', description: 'See where learners spend time.' },
    { id: 'admin-access', label: 'Access requests', description: 'Handle organization and lecturer access.' },
    { id: 'admin-problems', label: 'Problem pipeline', description: 'Review author handoffs before publishing.' },
    { id: 'admin-submissions', label: 'Submission feed', description: 'Watch latest verdicts for judging issues.' },
    { id: 'admin-bulk', label: 'Users', description: 'Manage roster imports and temporary account generation.' },
    { id: 'admin-activity', label: 'Recent activity', description: 'Audit latest admin actions.' },
    { id: 'admin-quick-actions', label: 'Quick actions', description: 'Shortcuts for common workflows.' },
  ]), []);

  const sectionSubsections = useMemo(() => ({
    'admin-overview': ['Metrics', 'Trends'],
    'admin-moderation': ['Reports', 'Requests'],
    'admin-judge': ['Load', 'Onboarding'],
    'admin-contests': ['Contest list', 'Create contest'],
    'admin-announcements': ['Announcement list', 'Create announcement'],
    'admin-settings': ['SMTP Config', 'Web Config'],
    'admin-usage': ['Tracks', 'Engagement'],
    'admin-access': ['Organizations', 'Lecturers'],
    'admin-problems': ['Pipeline', 'Publishing'],
    'admin-submissions': ['Verdicts', 'Issues'],
    'admin-bulk': ['Import users', 'Generate users'],
    'admin-activity': ['Audit log'],
    'admin-quick-actions': ['Shortcuts'],
  }), []);
  const [openParentSection, setOpenParentSection] = useState(null);
  const [activeChildSection, setActiveChildSection] = useState(null);
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
  const [smtpConfig, setSmtpConfig] = useState({
    server: '',
    port: '25',
    email: '',
    password: '',
    tls: false,
  });
  const [webConfig, setWebConfig] = useState({
    baseUrl: '',
    name: '',
    shortcut: '',
    footer: '',
    allowRegister: true,
    submissionShowAll: true,
  });
  const [generateUsersForm, setGenerateUsersForm] = useState({
    count: 10,
    prefix: 'student',
    role: 'learner',
    expiresAt: '',
  });

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

  const handleGenerateUsers = useCallback(() => {
    notifications.show({
      title: 'Generation queued',
      message: `${generateUsersForm.count} ${generateUsersForm.role} account(s) will use prefix "${generateUsersForm.prefix}".`,
      color: 'teal',
    });
  }, [generateUsersForm]);

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

  const handleContentChange = useCallback((content) => {
    setComposerValues((prev) => ({ ...prev, content }));
  }, []);

  const handleComposerSubmit = async ({ onSuccess } = {}) => {
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
      if (typeof onSuccess === 'function') {
        onSuccess(saved);
      }
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

  const handleSaveSmtp = useCallback(() => {
    // TODO: wire up backend call
    // placeholder to avoid unused state warnings
    console.log('Saving SMTP config', smtpConfig);
  }, [smtpConfig]);

  const handleSaveWeb = useCallback(() => {
    // TODO: wire up backend call
    console.log('Saving web config', webConfig);
  }, [webConfig]);

  const renderContestCreate = () => (
    <ContestCreate
      embedded
      onSuccess={() => {
        setOpenParentSection('admin-contests');
        setActiveChildSection('admin-contests::Contest list');
      }}
    />
  );

  const verdictColor = {
    AC: 'teal',
    WA: 'red',
    TLE: 'orange',
    CE: 'gray',
  };

  const renderSettings = () => (
    <Stack gap="lg">
      <Card withBorder shadow="sm" radius="md" p="md">
        <Stack gap="md">
          <Title order={4}>SMTP Config</Title>
          <Group grow align="flex-start">
            <TextInput
              label="Server"
              required
              value={smtpConfig.server}
              onChange={(e) => setSmtpConfig((prev) => ({ ...prev, server: e.currentTarget.value }))}
              placeholder="smtp.example.com"
            />
            <TextInput
              label="Port"
              required
              value={smtpConfig.port}
              onChange={(e) => setSmtpConfig((prev) => ({ ...prev, port: e.currentTarget.value }))}
              placeholder="25"
            />
          </Group>
          <Group grow align="flex-start">
            <TextInput
              label="Email"
              required
              value={smtpConfig.email}
              onChange={(e) => setSmtpConfig((prev) => ({ ...prev, email: e.currentTarget.value }))}
              placeholder="email@example.com"
            />
            <PasswordInput
              label="Password"
              required
              value={smtpConfig.password}
              onChange={(e) => setSmtpConfig((prev) => ({ ...prev, password: e.currentTarget.value }))}
              placeholder="SMTP Server Password"
            />
          </Group>
          <Switch
            label="TLS"
            checked={smtpConfig.tls}
            onChange={(e) => setSmtpConfig((prev) => ({ ...prev, tls: e.currentTarget.checked }))}
          />
          <Button onClick={handleSaveSmtp} leftSection={<IconSend size={16} />} maw={120}>
            Save
          </Button>
        </Stack>
      </Card>

      <Card withBorder shadow="sm" radius="md" p="md">
        <Stack gap="md">
          <Title order={4}>Web Config</Title>
          <Group grow align="flex-start">
            <TextInput
              label="Base Url"
              required
              value={webConfig.baseUrl}
              onChange={(e) => setWebConfig((prev) => ({ ...prev, baseUrl: e.currentTarget.value }))}
              placeholder="http://127.0.0.1"
            />
            <TextInput
              label="Name"
              required
              value={webConfig.name}
              onChange={(e) => setWebConfig((prev) => ({ ...prev, name: e.currentTarget.value }))}
              placeholder="Online Judge"
            />
            <TextInput
              label="Shortcut"
              required
              value={webConfig.shortcut}
              onChange={(e) => setWebConfig((prev) => ({ ...prev, shortcut: e.currentTarget.value }))}
              placeholder="oj"
            />
          </Group>
          <Textarea
            label="Footer"
            required
            minRows={2}
            value={webConfig.footer}
            onChange={(e) => setWebConfig((prev) => ({ ...prev, footer: e.currentTarget.value }))}
            placeholder="Online Judge Footer"
          />
          <Group grow>
            <Switch
              label="Allow Register"
              checked={webConfig.allowRegister}
              onChange={(e) => setWebConfig((prev) => ({ ...prev, allowRegister: e.currentTarget.checked }))}
            />
            <Switch
              label="Submission List Show All"
              checked={webConfig.submissionShowAll}
              onChange={(e) => setWebConfig((prev) => ({ ...prev, submissionShowAll: e.currentTarget.checked }))}
            />
          </Group>
          <Button onClick={handleSaveWeb} leftSection={<IconSend size={16} />} maw={120}>
            Save
          </Button>
        </Stack>
      </Card>
    </Stack>
  );

  const activeParentId = activeChildSection ? activeChildSection.split('::')[0] : null;
  const activeChildLabel = activeChildSection ? activeChildSection.split('::')[1] : null;

  useEffect(() => {
    if (activeParentId === 'admin-announcements' && activeChildLabel === 'Create announcement') {
      resetComposer();
    }
  }, [activeParentId, activeChildLabel]);

  const renderSectionContent = () => {
    if (!activeParentId) {
      return (
        <Stack align="center" justify="center" gap="xs" style={{ minHeight: 220 }}>
          <ThemeIcon size="xl" radius="xl" variant="light" color="gray">
            <IconArrowsSort size={22} />
          </ThemeIcon>
          <Text c="dimmed" size="sm">Select a subsection from the left panel to display its tools.</Text>
        </Stack>
      );
    }
    switch (activeParentId) {
      case 'admin-moderation':
        return (
          <ModerationSection
            loading={loading}
            moderationQueue={moderationQueue}
            severityColor={severityColor}
          />
        );
      case 'admin-judge':
        return (
          <JudgeSection
            systemStatus={systemStatus}
            cohorts={cohorts}
            loading={loading}
          />
        );
      case 'admin-contests':
        return activeChildLabel === 'Create contest'
          ? renderContestCreate()
          : (
            <ContestsSection
              contestOps={contestOps}
              loading={loading}
              onOpenContest={(href) => navigate(href)}
            />
          );
      case 'admin-announcements':
        if (activeChildLabel === 'Create announcement') {
          return (
            <AnnouncementCreateSection
              composerValues={composerValues}
              setComposerValues={setComposerValues}
              tinyMceApiKey={tinyMceApiKey}
              audienceOptions={audienceOptions}
              channelOptions={channelOptions}
              handleContentChange={handleContentChange}
              handleComposerSubmit={() =>
                handleComposerSubmit({
                  onSuccess: () => {
                    setOpenParentSection('admin-announcements');
                    setActiveChildSection('admin-announcements::Announcement list');
                  },
                })
              }
              composerSaving={composerSaving}
              onCancel={() => {
                resetComposer();
                setOpenParentSection('admin-announcements');
                setActiveChildSection('admin-announcements::Announcement list');
              }}
            />
          );
        }
        return (
          <AnnouncementsListSection
            loading={announcementsLoading}
            error={announcementsError}
            onRefresh={fetchAnnouncements}
            stats={announcementStats}
            filter={announcementFilter}
            onFilterChange={setAnnouncementFilter}
            search={announcementSearch}
            onSearchChange={setAnnouncementSearch}
            announcements={sortedAnnouncements}
            announcementStatusColor={announcementStatusColor}
            audienceLabels={audienceLabels}
            selectedAnnouncement={selectedAnnouncement}
            onSelectAnnouncement={setSelectedAnnouncement}
            onStatusToggle={handleStatusToggle}
            onDelete={handleDeleteAnnouncement}
            onPinToggle={handlePinToggle}
            onPublishNow={handlePublishNow}
            onCreateAnnouncement={() => {
              resetComposer();
              setOpenParentSection('admin-announcements');
              setActiveChildSection('admin-announcements::Create announcement');
            }}
            onEditAnnouncement={openComposer}
            composerOpen={composerOpen}
            onComposerClose={handleComposerClose}
            composerValues={composerValues}
            setComposerValues={setComposerValues}
            handleContentChange={handleContentChange}
            audienceOptions={audienceOptions}
            channelOptions={channelOptions}
            handleComposerSubmit={handleComposerSubmit}
            composerSaving={composerSaving}
            tinyMceApiKey={tinyMceApiKey}
          />
        );
      case 'admin-settings':
        return renderSettings();
      case 'admin-usage':
        return <UsageSection usage={usage} />;
      case 'admin-access':
        return (
          <AccessSection
            loading={loading}
            accessRequests={accessRequests}
          />
        );
      case 'admin-problems':
        return (
          <ProblemsSection
            loading={loading}
            problemPipeline={problemPipeline}
            onCreateProblem={() => navigate('/problems/new')}
          />
        );
      case 'admin-submissions':
        return (
          <SubmissionsSection
            loading={loading}
            submissionFeed={submissionFeed}
            verdictColor={verdictColor}
            onViewAll={() => navigate('/submissions')}
          />
        );
      case 'admin-activity':
        return <ActivitySection activity={activity} />;
      case 'admin-quick-actions':
        return <QuickActionsSection />;
      case 'admin-bulk':
        return activeChildLabel === 'Generate users'
          ? (
            <UserGenerateSection
              generateUsersForm={generateUsersForm}
              setGenerateUsersForm={setGenerateUsersForm}
              handleGenerateUsers={handleGenerateUsers}
            />
          )
          : <UserImportSection onDownloadTemplate={handleDownloadTemplate} />;
      case 'admin-overview':
      default:
        return <OverviewSection loading={loading} stats={stats} />;
    }
  };

  const activeMeta = sectionLinks.find((section) => section.id === activeParentId);

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
                <Accordion
                  chevronPosition="right"
                  multiple={false}
                  value={openParentSection}
                  onChange={(value) => setOpenParentSection(value)}
                >
                  {sectionLinks.map((section) => (
                    <Accordion.Item key={section.id} value={section.id}>
                      <Accordion.Control
                        styles={{
                          root: { justifyContent: 'flex-start', textAlign: 'left' },
                          label: { justifyContent: 'flex-start', textAlign: 'left', width: '100%' },
                        }}
                      >
                        <Text fw={500} size="md" style={{ width: '100%', textAlign: 'left' }}>
                          {section.label}
                        </Text>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Stack gap="xs">
                          <Stack gap={4}>
                            {(sectionSubsections[section.id] || ['Details']).map((sub) => {
                              const childValue = `${section.id}::${sub}`;
                              const isActive = activeChildSection === childValue;
                              return (
                                <Button
                                  key={sub}
                                  variant={isActive ? 'light' : 'subtle'}
                                  size="xs"
                                  fullWidth
                                  styles={{
                                    root: {
                                      borderRadius: 0,
                                      justifyContent: 'flex-start',
                                      paddingInline: 0,
                                    },
                                    inner: {
                                      justifyContent: 'flex-start',
                                      width: '100%',
                                    },
                                    label: {
                                      fontSize: '0.95rem',
                                      fontWeight: 100,
                                      justifyContent: 'flex-start',
                                    },
                                  }}
                                  onClick={() => {
                                    setOpenParentSection(section.id);
                                    setActiveChildSection(childValue);
                                  }}
                                >
                                  {sub}
                                </Button>
                              );
                            })}
                          </Stack>
                        </Stack>
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}
                </Accordion>
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
                  <Group gap={4}>
                    <Text fw={700}>{activeMeta?.label || 'Select a section'}</Text>
                    {activeChildLabel && (
                      <>
                        <Text c="dimmed">/</Text>
                        <Text fw={600}>{activeChildLabel}</Text>
                      </>
                    )}
                  </Group>
                  {(activeMeta?.description && activeParentId) && (
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
