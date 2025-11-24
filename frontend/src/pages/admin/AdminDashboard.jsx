import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Box, Button, Grid, Group, Paper, ScrollArea, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconAlertTriangle, IconArrowsSort } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import ContestCreate from './ContestCreate';
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
} from '../../components/admin/AdminSections.jsx';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminDashboardHeader from '../../components/admin/AdminDashboardHeader';
import SettingsSection from '../../components/admin/SettingsSection';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { 
  severityColor, 
  announcementStatusColor, 
  audienceLabels, 
  audienceOptions, 
  channelOptions,
  verdictColor,
  sectionLinks,
} from '../../constants/admin';

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  const [openParentSection, setOpenParentSection] = useState(null);
  const [activeChildSection, setActiveChildSection] = useState(null);
  const [generateUsersForm, setGenerateUsersForm] = useState({
    count: 10,
    prefix: 'student',
    role: 'learner',
    expiresAt: '',
  });

  const {
    loading,
    error,
    lastUpdatedText,
    stats,
    moderationQueue,
    cohorts,
    accessRequests,
    activity,
    usage,
    contestOps,
    problemPipeline,
    submissionFeed,
    systemStatus,
    fetchDashboard,
  } = useAdminDashboard();

  const {
    announcementsLoading,
    announcementsError,
    announcementFilter,
    setAnnouncementFilter,
    announcementSearch,
    setAnnouncementSearch,
    selectedAnnouncement,
    setSelectedAnnouncement,
    composerOpen,
    composerSaving,
    composerValues,
    setComposerValues,
    sortedAnnouncements,
    announcementStats,
    fetchAnnouncements,
    openComposer,
    handleStatusToggle,
    handlePinToggle,
    handlePublishNow,
    handleDeleteAnnouncement,
    handleContentChange,
    handleComposerSubmit,
    handleComposerClose,
    resetComposer,
  } = useAnnouncements();

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

  const activeParentId = activeChildSection ? activeChildSection.split('::')[0] : null;
  const activeChildLabel = activeChildSection ? activeChildSection.split('::')[1] : null;

  useEffect(() => {
    if (activeParentId === 'admin-announcements' && activeChildLabel === 'Create announcement') {
      resetComposer();
    }
  }, [activeParentId, activeChildLabel, resetComposer]);

  const renderContestCreate = () => (
    <ContestCreate
      embedded
      onSuccess={() => {
        setOpenParentSection('admin-contests');
        setActiveChildSection('admin-contests::Contest list');
      }}
    />
  );

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
              audienceOptions={audienceOptions}
              channelOptions={channelOptions}
              handleContentChange={handleContentChange}
              handleComposerSubmit={() => handleComposerSubmit()}
              composerSaving={composerSaving}
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
          />
        );
      case 'admin-settings':
        return <SettingsSection />;
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
    <Box style={{ minHeight: 'calc(100vh - 80px)' }}>
      <Stack gap="lg">
        <AdminDashboardHeader lastUpdatedText={lastUpdatedText} />

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
            <AdminSidebar
              openParentSection={openParentSection}
              setOpenParentSection={setOpenParentSection}
              activeChildSection={activeChildSection}
              setActiveChildSection={setActiveChildSection}
            />
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
