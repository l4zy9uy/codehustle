// Admin dashboard constants

export const severityColor = {
  high: 'red',
  medium: 'yellow',
  low: 'gray',
};

export const announcementStatusColor = {
  published: 'teal',
  scheduled: 'yellow',
  draft: 'gray',
  archived: 'red',
};

export const audienceLabels = {
  global: 'All learners',
  course: 'Course cohort',
  program: 'Program / track',
  cohort: 'Custom cohort',
};

export const audienceOptions = [
  { value: 'global', label: 'All learners' },
  { value: 'course', label: 'Course cohort' },
  { value: 'program', label: 'Program / track' },
  { value: 'cohort', label: 'Custom cohort' },
];

export const channelOptions = [
  { value: 'web', label: 'Web' },
  { value: 'email', label: 'Email' },
  { value: 'push', label: 'Push' },
];

export const defaultAnnouncementForm = {
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

export const verdictColor = {
  AC: 'teal',
  WA: 'red',
  TLE: 'orange',
  CE: 'gray',
};

export const sectionLinks = [
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
];

export const sectionSubsections = {
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
};

