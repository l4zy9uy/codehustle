import React from 'react';
import {
  Alert,
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  Modal,
  MultiSelect,
  NumberInput,
  Paper,
  Progress,
  RingProgress,
  ScrollArea,
  SegmentedControl,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  ThemeIcon,
} from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Editor } from '@tinymce/tinymce-react';
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
  IconSearch,
  IconSend,
  IconShieldCheck,
  IconSparkles,
  IconSpeakerphone,
  IconTrash,
  IconUpload,
  IconUserPlus,
} from '@tabler/icons-react';
import { format, formatDistanceToNow } from 'date-fns';

export function OverviewSection({ loading, stats }) {
  return (
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
}

export function ModerationSection({ loading, moderationQueue, severityColor }) {
  return (
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
}

export function JudgeSection({ systemStatus, cohorts, loading }) {
  return (
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
                <Text size="sm" c="dimmed" style={{ marginTop: 'var(--mantine-spacing-xs)' }}>
                  Incidents open: <Text span fw={600}>{systemStatus.incidentsOpen}</Text>
                </Text>
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
}

export function UsageSection({ usage }) {
  return (
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
}

export function ContestsSection({ contestOps, loading, onOpenContest }) {
  const contestStatusColor = {
    live: 'teal',
    upcoming: 'blue',
    draft: 'gray',
  };

  return (
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
            <Button size="xs" onClick={() => onOpenContest(contest.href || `/contests/${contest.id}`)}>
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
}

export function AnnouncementsListSection({
  loading,
  error,
  onRefresh,
  stats,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  announcements,
  announcementStatusColor,
  audienceLabels,
  selectedAnnouncement,
  onSelectAnnouncement,
  onStatusToggle,
  onDelete,
  onPinToggle,
  onPublishNow,
  onCreateAnnouncement,
  onEditAnnouncement,
  composerOpen,
  onComposerClose,
  composerValues,
  setComposerValues,
  handleContentChange,
  audienceOptions,
  channelOptions,
  handleComposerSubmit,
  composerSaving,
  tinyMceApiKey,
}) {
  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
        <Group gap="xs">
          <ThemeIcon variant="light" color="indigo" radius="md">
            <IconSpeakerphone size={16} />
          </ThemeIcon>
          <Stack gap={2}>
            <Text fw={600}>Announcements</Text>
            <Text size="sm" c="dimmed">Review, filter, and manage broadcast updates.</Text>
          </Stack>
        </Group>
        <Group gap="xs">
          <Button
            size="xs"
            variant="default"
            leftSection={<IconRefresh size={14} />}
            loading={loading}
            onClick={onRefresh}
          >
            Refresh
          </Button>
          <Button
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={onCreateAnnouncement}
          >
            New announcement
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert color="red" title="Announcements">
          <Text size="sm">{error}</Text>
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
            {loading ? (
              <Skeleton height={32} mt="sm" />
            ) : (
              <Group justify="space-between" align="center" mt="xs">
                <Text fw={700} size="xl">{stats[metric.key] || 0}</Text>
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
                value={filter}
                onChange={onFilterChange}
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
                value={search}
                onChange={(event) => onSearchChange(event.currentTarget.value)}
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
                  {loading && !announcements.length
                    ? Array.from({ length: 3 }).map((_, idx) => (
                      <Table.Tr key={idx}>
                        <Table.Td colSpan={5}>
                          <Skeleton height={40} />
                        </Table.Td>
                      </Table.Tr>
                    ))
                    : null}
                  {!loading && announcements.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={5}>
                        <Text size="sm" c="dimmed" ta="center">No announcements match the current filters.</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                  {announcements.map((announcement) => {
                    const publishDate = new Date(announcement.publishAt || announcement.date || 0);
                    const hasDate = !Number.isNaN(publishDate.getTime());
                    return (
                      <Table.Tr
                        key={announcement.id}
                        onClick={() => onSelectAnnouncement(announcement)}
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
                                onEditAnnouncement(announcement);
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
                                onStatusToggle(announcement);
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
                                onDelete(announcement);
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
                  <Button size="xs" variant="default" onClick={() => onPinToggle(selectedAnnouncement)}>
                    {selectedAnnouncement.pinned ? 'Unpin' : 'Pin'}
                  </Button>
                  <Button size="xs" variant="light" onClick={() => onEditAnnouncement(selectedAnnouncement)}>
                    Edit
                  </Button>
                  {selectedAnnouncement.status !== 'published' && (
                    <Button
                      size="xs"
                      color="teal"
                      leftSection={<IconSend size={14} />}
                      onClick={() => onPublishNow(selectedAnnouncement)}
                    >
                      Publish now
                    </Button>
                  )}
                  <Button size="xs" variant="subtle" color="red" onClick={() => onDelete(selectedAnnouncement)}>
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
        onClose={onComposerClose}
        title="Edit announcement"
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
          <div style={{ flex: 1 }}>
            <Text size="xs" c="dimmed" mb={4}>Rich text</Text>
            <Editor
              apiKey={tinyMceApiKey}
              value={composerValues.content}
              onEditorChange={handleContentChange}
              init={{
                height: 320,
                menubar: false,
                branding: false,
                plugins: 'lists link code table',
                toolbar: 'undo redo | bold italic underline | bullist numlist | link | code',
                placeholder: 'Write an announcement... Use the toolbar for formatting.',
              }}
            />
          </div>
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
            <Button variant="default" onClick={onComposerClose}>
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
}

export function AnnouncementCreateSection({
  composerValues,
  setComposerValues,
  tinyMceApiKey,
  audienceOptions,
  channelOptions,
  handleContentChange,
  handleComposerSubmit,
  composerSaving,
}) {
  return (
    <Stack gap="md">
      <Text fw={600} size="lg">Create announcement</Text>
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
      <div style={{ flex: 1 }}>
        <Text size="xs" c="dimmed" mb={4}>Rich text</Text>
        <Editor
          apiKey={tinyMceApiKey}
          value={composerValues.content}
          onEditorChange={handleContentChange}
          init={{
            height: 320,
            menubar: false,
            branding: false,
            plugins: 'lists link code table',
            toolbar: 'undo redo | bold italic underline | bullist numlist | link | code',
            placeholder: 'Write an announcement... Use the toolbar for formatting.',
          }}
        />
      </div>
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
      <Group justify="flex-end">
        <Button onClick={handleComposerSubmit} loading={composerSaving}>
          Save announcement
        </Button>
      </Group>
    </Stack>
  );
}

export function AccessSection({ loading, accessRequests }) {
  return (
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
}

export function ProblemsSection({ loading, problemPipeline, onCreateProblem }) {
  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Problem pipeline</Text>
        <Button size="xs" variant="light" onClick={onCreateProblem}>
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
}

export function SubmissionsSection({ loading, submissionFeed, verdictColor, onViewAll }) {
  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Latest submissions</Text>
        <Button size="xs" variant="light" onClick={onViewAll}>
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
}

export function UserImportSection({ onDownloadTemplate }) {
  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="md">
        <div>
          <Text fw={600}>Import user roster</Text>
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
          <Button variant="light" onClick={onDownloadTemplate}>
            Download template
          </Button>
        </Group>
        <Text size="xs" c="dimmed">Advanced options like contest scoping live in Admin Settings.</Text>
      </Stack>
    </Paper>
  );
}

export function UserGenerateSection({ generateUsersForm, setGenerateUsersForm, handleGenerateUsers }) {
  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="md">
        <div>
          <Text fw={600}>Generate temporary users</Text>
          <Text size="sm" c="dimmed">Create short-lived accounts for contests, labs, or onboarding drills.</Text>
        </div>
        <Group grow align="flex-end">
          <NumberInput
            label="Quantity"
            min={1}
            max={500}
            value={generateUsersForm.count}
            onChange={(value) =>
              setGenerateUsersForm((prev) => ({ ...prev, count: Number(value) || 0 }))
            }
          />
          <TextInput
            label="Handle prefix"
            placeholder="student"
            value={generateUsersForm.prefix}
            onChange={(event) =>
              setGenerateUsersForm((prev) => ({ ...prev, prefix: event.currentTarget.value }))
            }
          />
          <Select
            label="Role"
            data={[
              { value: 'learner', label: 'Learner' },
              { value: 'coach', label: 'Coach' },
              { value: 'judge', label: 'Judge' },
            ]}
            value={generateUsersForm.role}
            onChange={(value) =>
              setGenerateUsersForm((prev) => ({ ...prev, role: value || 'learner' }))
            }
          />
        </Group>
        <TextInput
          label="Expires on"
          type="date"
          value={generateUsersForm.expiresAt}
          onChange={(event) =>
            setGenerateUsersForm((prev) => ({ ...prev, expiresAt: event.currentTarget.value }))
          }
          description="Optional automatic deactivation date."
        />
        <Group gap="sm">
          <Button leftSection={<IconSparkles size={16} />} onClick={handleGenerateUsers}>
            Generate list
          </Button>
          <Button variant="light">Download credentials</Button>
        </Group>
        <Alert color="yellow" variant="light">
          <Text size="sm">
            These accounts are mock placeholders. Wire up the admin API to persist them in your backend.
          </Text>
        </Alert>
      </Stack>
    </Paper>
  );
}

export function ActivitySection({ activity }) {
  return (
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
}

export function QuickActionsSection() {
  return (
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
}

