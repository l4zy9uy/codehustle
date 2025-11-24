
export const mockUser = {
  role: "admin", // "admin", "editor", "student"
  id: 'u_1',
  email: 'mock@example.com',
  name: 'Mock User',
  handle: 'mock_user',
  avatarUrl: 'https://i.pravatar.cc/150?img=3',
};

export const mockStats = { total: 123, easy: 77, medium: 35, hard: 11 };

export const mockRecentSubmissions = [
  { id: 's_1', problemTitle: 'Two Sum', verdict: 'AC', language: 'C++17', submittedAt: '2025-01-05T18:15:00Z' },
  { id: 's_2', problemTitle: 'Valid Parentheses', verdict: 'WA', language: 'Python', submittedAt: '2025-01-06T19:55:00Z' },
  { id: 's_3', problemTitle: 'Merge Intervals', verdict: 'TLE', language: 'Java', submittedAt: '2025-01-07T10:05:00Z' },
];

export const courses = [
  {
    id: '1',
    title: 'Introduction to Data Structures',
    lecturer: 'Prof. Jane Doe',
    startDate: '2025-09-01',
    endDate: '2025-12-31',
    term: 'Fall 2025',
    cohort: 'CS204',
    enrolled: 148,
    capacity: 160,
    progress: 0.68,
    mode: 'In-person',
    status: 'active',
    tags: ['core', 'year-2'],
    summary: 'Weekly labs on arrays, trees, and hashing with auto-graded practice sets.',
    nextMilestone: 'Lab 3 due Sep 18',
    updatedAt: '2025-09-05T09:30:00Z',
  },
  {
    id: '2',
    title: 'Advanced Algorithms',
    lecturer: 'Dr. John Smith',
    startDate: '2025-08-15',
    endDate: '2025-11-30',
    term: 'Fall 2025',
    cohort: 'CS301',
    enrolled: 112,
    capacity: 120,
    progress: 0.52,
    mode: 'Hybrid',
    status: 'active',
    tags: ['algorithms', 'contest'],
    summary: 'Graph theory masterclass aligned with ICPC practice contests.',
    nextMilestone: 'Contest checkpoint this Friday',
    updatedAt: '2025-09-04T15:45:00Z',
  },
  {
    id: '3',
    title: 'Database Systems',
    lecturer: 'Ms. Alice Nguyen',
    startDate: '2025-10-10',
    endDate: '2026-01-20',
    term: 'Winter 2025',
    cohort: 'CS310',
    enrolled: 96,
    capacity: 110,
    progress: 0.18,
    mode: 'Online',
    status: 'upcoming',
    tags: ['systems', 'project'],
    summary: 'Hands-on SQL tuning labs and storage engine deep dives.',
    nextMilestone: 'Cohort orientation Oct 3',
    updatedAt: '2025-09-02T12:10:00Z',
  },
  {
    id: '4',
    title: 'Programming Languages Studio',
    lecturer: 'Dr. Minh Phan',
    startDate: '2025-07-01',
    endDate: '2025-08-05',
    term: 'Summer 2025',
    cohort: 'CS350',
    enrolled: 40,
    capacity: 40,
    progress: 1,
    mode: 'Online',
    status: 'completed',
    tags: ['elective', 'capstone'],
    summary: 'Short intensive on interpreters and type systems.',
    nextMilestone: 'Grades released Aug 8',
    updatedAt: '2025-08-06T08:00:00Z',
  },
  {
    id: '5',
    title: 'Competitive Programming Bootcamp',
    lecturer: 'Coach Lan Tran',
    startDate: '2025-11-05',
    endDate: '2025-12-20',
    term: 'Winter 2025',
    cohort: 'ICPC-ELITE',
    enrolled: 54,
    capacity: 60,
    progress: 0,
    mode: 'In-person',
    status: 'draft',
    tags: ['icpc', 'training'],
    summary: 'Invite-only camp with daily contests and editorials.',
    nextMilestone: 'Roster lock Oct 25',
    updatedAt: '2025-09-03T18:20:00Z',
  },
  {
    id: '6',
    title: 'Machine Learning for Engineers',
    lecturer: 'Dr. Giang Truong',
    startDate: '2025-09-20',
    endDate: '2025-12-05',
    term: 'Fall 2025',
    cohort: 'CS421',
    enrolled: 180,
    capacity: 180,
    progress: 0.42,
    mode: 'Hybrid',
    status: 'active',
    tags: ['ml', 'industry'],
    summary: 'Mini-projects combining applied ML and judge-backed datasets.',
    nextMilestone: 'Project proposal reviews Oct 2',
    updatedAt: '2025-09-06T10:05:00Z',
  },
  {
    id: '7',
    title: 'Systems Programming Practicum',
    lecturer: 'Ms. My Dinh',
    startDate: '2025-09-05',
    endDate: '2025-12-10',
    term: 'Fall 2025',
    cohort: 'CS330',
    enrolled: 88,
    capacity: 95,
    progress: 0.33,
    mode: 'In-person',
    status: 'active',
    tags: ['systems', 'lab'],
    summary: 'Kernel-style labs with automated testing harnesses.',
    nextMilestone: 'Lab 2 code review Sep 21',
    updatedAt: '2025-09-05T16:55:00Z',
  },
];

export const courseInfo = {
  '1': {
    title: 'Introduction to Data Structures',
    lecturer: 'Prof. Jane Doe',
    term: 'Sep–Dec 2025',
    description:
      'Learn core data structures and their applications through curated practice problems aligned with weekly topics.',
  },
  '2': {
    title: 'Advanced Algorithms',
    lecturer: 'Dr. John Smith',
    term: 'Aug–Nov 2025',
    description:
      'Focus on graph algorithms, dynamic programming, and complexity analysis with a practice-first approach.',
  },
  '3': {
    title: 'Database Systems',
    lecturer: 'Ms. Alice Nguyen',
    term: 'Oct 2025–Jan 2026',
    description:
      'Hands-on problems covering relational modeling, SQL query optimization, and concurrency control.',
  },
  '4': {
    title: 'Programming Languages Studio',
    lecturer: 'Dr. Minh Phan',
    term: 'Jul–Aug 2025',
    description:
      'Fast-paced studio on interpreters, compilers, and advanced typing rules with weekly milestones.',
  },
  '5': {
    title: 'Competitive Programming Bootcamp',
    lecturer: 'Coach Lan Tran',
    term: 'Nov–Dec 2025',
    description:
      'Invite-only ICPC bootcamp with daily virtual rounds and editorial breakdowns.',
  },
  '6': {
    title: 'Machine Learning for Engineers',
    lecturer: 'Dr. Giang Truong',
    term: 'Sep–Dec 2025',
    description:
      'Project-driven course combining applied ML practice problems with judge-backed datasets.',
  },
  '7': {
    title: 'Systems Programming Practicum',
    lecturer: 'Ms. My Dinh',
    term: 'Sep–Dec 2025',
    description:
      'Kernel-style labs on concurrency, synchronization, and IPC patterns for high-performance systems.',
  },
};

export const courseProblems = {
  '1': [
    { id: 'ds-1', slug: 'two-sum', title: 'Two Sum', difficulty: 'easy', tags: ['array', 'hash'], solved: true, acceptanceRate: 72, href: '/problems/two-sum' },
    { id: 'ds-2', slug: 'valid-parentheses', title: 'Valid Parentheses', difficulty: 'easy', tags: ['stack'], solved: true, acceptanceRate: 64, href: '/problems/valid-parentheses' },
    { id: 'ds-3', slug: 'merge-intervals', title: 'Merge Intervals', difficulty: 'medium', tags: ['intervals', 'sorting'], solved: false, acceptanceRate: 41, href: '/problems/merge-intervals' },
    { id: 'ds-4', slug: 'lfu-cache', title: 'LFU Cache', difficulty: 'hard', tags: ['hash', 'heap'], solved: false, acceptanceRate: 19, href: '/problems/lfu-cache' },
    { id: 'ds-5', slug: 'binary-tree-level-order', title: 'Binary Tree Level Order Traversal', difficulty: 'medium', tags: ['tree', 'bfs'], solved: false, acceptanceRate: 58, href: '/problems/binary-tree-level-order' },
  ],
  '2': [
    { id: 'aa-1', slug: 'dijkstra-sparse', title: 'Dijkstra on Sparse Graphs', difficulty: 'medium', tags: ['graphs', 'shortest-paths'], solved: true, acceptanceRate: 62, href: '/problems/dijkstra-sparse' },
    { id: 'aa-2', slug: 'bellman-ford-edges-log', title: 'Bellman-Ford with Edges Log', difficulty: 'medium', tags: ['graphs', 'shortest-paths'], solved: false, acceptanceRate: 54, href: '/problems/bellman-ford-edges-log' },
    { id: 'aa-3', slug: 'negative-cycle-detection', title: 'Negative Cycle Detection', difficulty: 'hard', tags: ['graphs'], solved: false, acceptanceRate: 37, href: '/problems/negative-cycle-detection' },
    { id: 'aa-4', slug: 'multi-source-shortest-queries', title: 'Shortest Path Queries (Multi-source)', difficulty: 'hard', tags: ['graphs'], solved: true, acceptanceRate: 29, href: '/problems/multi-source-shortest-queries' },
    { id: 'aa-5', slug: 'assignment-1-pathfinding', title: 'Assignment 1: Pathfinding', difficulty: 'medium', tags: ['graded', 'graphs'], solved: false, href: '/problems/assignment-1-pathfinding' },
  ],
  '3': [
    { id: 'db-1', slug: 'sql-join-optimization', title: 'SQL Join Optimization', difficulty: 'medium', tags: ['sql', 'optimization'], solved: false, acceptanceRate: 47, href: '/problems/sql-join-optimization' },
    { id: 'db-2', slug: 'transaction-scheduling', title: 'Transaction Scheduling', difficulty: 'hard', tags: ['transactions', 'scheduling'], solved: false, acceptanceRate: 21, href: '/problems/transaction-scheduling' },
    { id: 'db-3', slug: 'index-selection', title: 'Index Selection', difficulty: 'easy', tags: ['indexing'], solved: true, acceptanceRate: 70, href: '/problems/index-selection' },
  ],
  '4': [
    { id: 'pl-1', slug: 'lambda-calculus-basics', title: 'Lambda Calculus Basics', difficulty: 'medium', tags: ['functional'], solved: false, acceptanceRate: 58, href: '/problems/lambda-calculus-basics' },
    { id: 'pl-2', slug: 'type-inference', title: 'Type Inference Checkpoint', difficulty: 'hard', tags: ['types', 'inference'], solved: false, acceptanceRate: 34, href: '/problems/type-inference' },
    { id: 'pl-3', slug: 'interpreter-simulation', title: 'Interpreter Simulation', difficulty: 'medium', tags: ['simulation'], solved: true, acceptanceRate: 62, href: '/problems/interpreter-simulation' },
  ],
  '5': [
    { id: 'boot-1', slug: 'icpc-greedy', title: 'ICPC Greedy Warmup', difficulty: 'easy', tags: ['greedy'], solved: true, acceptanceRate: 81, href: '/problems/icpc-greedy' },
    { id: 'boot-2', slug: 'icpc-dp', title: 'ICPC DP Ladder', difficulty: 'hard', tags: ['dp'], solved: false, acceptanceRate: 27, href: '/problems/icpc-dp' },
    { id: 'boot-3', slug: 'icpc-graphs', title: 'Graph Marathon', difficulty: 'hard', tags: ['graphs'], solved: false, acceptanceRate: 19, href: '/problems/icpc-graphs' },
  ],
  '6': [
    { id: 'ml-1', slug: 'linear-regression', title: 'Linear Regression Fit', difficulty: 'easy', tags: ['ml', 'math'], solved: true, acceptanceRate: 76, href: '/problems/linear-regression' },
    { id: 'ml-2', slug: 'gradient-check', title: 'Gradient Checkpoint', difficulty: 'medium', tags: ['ml', 'calculus'], solved: false, acceptanceRate: 49, href: '/problems/gradient-check' },
    { id: 'ml-3', slug: 'cnn-tuning', title: 'CNN Hyperparameter Tuning', difficulty: 'hard', tags: ['ml', 'cnn'], solved: false, acceptanceRate: 22, href: '/problems/cnn-tuning' },
  ],
  '7': [
    { id: 'sys-1', slug: 'thread-scheduler', title: 'Thread Scheduler', difficulty: 'medium', tags: ['threads'], solved: true, acceptanceRate: 60, href: '/problems/thread-scheduler' },
    { id: 'sys-2', slug: 'ipc-channels', title: 'IPC Channels', difficulty: 'medium', tags: ['ipc', 'synchronization'], solved: false, acceptanceRate: 43, href: '/problems/ipc-channels' },
    { id: 'sys-3', slug: 'lock-free-queue', title: 'Lock-free Queue', difficulty: 'hard', tags: ['lock-free', 'concurrency'], solved: false, acceptanceRate: 18, href: '/problems/lock-free-queue' },
  ],
};

// Global problems list (flatten course problems and add href/acceptanceRate default)
export const problems = Object.values(courseProblems)
  .flat()
  .map((p, idx) => ({
    index: idx + 1,
    ...p,
    acceptanceRate: p.acceptanceRate ?? 50,
    // Synthetic solvedCount so the UI can display values.
    // Prefer any provided value on the item, else estimate from acceptanceRate.
    solvedCount: p.solvedCount ?? Math.round(((p.acceptanceRate ?? 50) / 100) * 5000),
  }));

export const allTags = Array.from(
  new Set(problems.flatMap((p) => (p.tags || []).map(String)))
).sort();

export const contests = [
  {
    id: 'icpc-winter',
    name: 'ICPC Winter Practice',
    type: 'team',
    format: 'ICPC',
    status: 'live',
    startTime: '2025-01-08T13:00:00Z',
    endTime: '2025-01-08T17:00:00Z',
    timeLimitHours: 4,
    duration: 4,
    participants: 132,
    tags: ['icpc', 'practice'],
    shortDescription: 'Four-hour scrimmage with ICPC style scoring and freeze at t-1h.',
    isMirror: false,
  },
  {
    id: 'cs301-final',
    name: 'CS301 Final Contest',
    type: 'individual',
    format: 'IOI',
    status: 'upcoming',
    startTime: '2025-01-12T02:00:00Z',
    endTime: '2025-01-12T06:00:00Z',
    timeLimitHours: 4,
    duration: 4,
    participants: 410,
    tags: ['course', 'graded'],
    shortDescription: 'Capstone contest aligned with CS301 Algorithms grade weight.',
    isMirror: false,
  },
  {
    id: 'algo-open-7',
    name: 'Algorithms Open #7',
    type: 'individual',
    format: 'AtCoder',
    status: 'registration',
    startTime: '2025-01-20T10:00:00Z',
    endTime: '2025-01-20T12:30:00Z',
    timeLimitHours: 2.5,
    duration: 2.5,
    participants: 0,
    tags: ['open', 'rating'],
    shortDescription: 'Biweekly open round with new tasks from student setters.',
    isMirror: true,
  },
];

export const contestDetails = {
  'icpc-winter': {
    ...contests[0],
    rules: 'ICPC rules, freeze during last hour, 20 minutes penalty per incorrect submission.',
    prizes: ['Top 3 teams earn travel stipend'],
    scoreboardFreezeAt: '2025-01-08T16:00:00Z',
    problems: ['Array Game', 'Portal Network', 'Tree Partition'],
  },
  'cs301-final': {
    ...contests[1],
    rules: 'Closed-book assessment, 2 attempts per problem, manual review for plagiarism.',
    prizes: [],
    scoreboardFreezeAt: '2025-01-12T05:00:00Z',
    problems: ['DP Lab 5', 'Flow Assignment', 'Suffix Gadget'],
  },
  'algo-open-7': {
    ...contests[2],
    rules: 'AtCoder style scoring with partial points, upsolving allowed after contest.',
    prizes: ['Top 10 receive swag'],
    scoreboardFreezeAt: null,
    problems: ['Grid Teleport', 'Binary Chef', 'Segment Tower'],
  },
};

export const adminDashboard = {
  stats: [
    { id: 'active-learners', label: 'Active learners (24h)', value: 1284, change: 12, helper: 'vs yesterday' },
    { id: 'new-signups', label: 'New sign-ups', value: 74, change: 5, helper: 'today' },
    { id: 'pending-approvals', label: 'Pending approvals', value: 18, change: -3, helper: 'awaiting review' },
    { id: 'judge-queue', label: 'Avg judge queue', value: '0.42s', change: -0.12, helper: 'last 15m' },
  ],
  contestOps: [
    { id: 'icpc-winter', name: 'ICPC Winter Practice', status: 'live', phase: 'Freeze in 42m', participants: 132, flagged: 3, href: '/contests/icpc-winter' },
    { id: 'cs301-final', name: 'CS301 Final Contest', status: 'upcoming', phase: 'Starts in 2d 5h', participants: 410, flagged: 0, href: '/contests/cs301-final' },
    { id: 'algo-open', name: 'Algorithms Open #7', status: 'draft', phase: 'Needs approvals', participants: 0, flagged: 0, href: '/contests/algo-open' },
  ],
  problemPipeline: [
    { id: 'prob-graph-ops', title: 'Dynamic Graph Operations', owner: 'Dr. Hoang', difficulty: 'Hard', status: 'Needs extra tests', updatedAt: '2025-01-08T11:30:00Z' },
    { id: 'prob-dp-assign', title: 'DP Assignment 4', owner: 'Prof. An', difficulty: 'Medium', status: 'Awaiting review', updatedAt: '2025-01-07T09:15:00Z' },
    { id: 'prob-sim', title: 'Simulator Warmup', owner: 'Coach Minh', difficulty: 'Easy', status: 'Ready to publish', updatedAt: '2025-01-05T22:45:00Z' },
  ],
  submissionFeed: [
    { id: 'feed-1', user: 'lan.pham', problem: 'Binary Indexed Tree', verdict: 'AC', language: 'C++17', submittedAt: '2025-01-08T14:10:00Z' },
    { id: 'feed-2', user: 'hung.ngo', problem: 'Teleportation Network', verdict: 'WA', language: 'Python 3.10', submittedAt: '2025-01-08T14:09:00Z' },
    { id: 'feed-3', user: 'lena.nguyen', problem: 'Graph Lab 4 - SSSP', verdict: 'TLE', language: 'Java 17', submittedAt: '2025-01-08T14:08:00Z' },
    { id: 'feed-4', user: 'team.cat', problem: 'ICPC Live - Problem D', verdict: 'AC', language: 'C++17', submittedAt: '2025-01-08T14:07:00Z' },
  ],
  usageBreakdown: [
    { id: 'ds', label: 'Data Structures', percent: 42 },
    { id: 'algo', label: 'Algorithms', percent: 33 },
    { id: 'systems', label: 'Systems', percent: 16 },
    { id: 'misc', label: 'Other tracks', percent: 9 },
  ],
  systemStatus: {
    incidentsOpen: 1,
    uptime: 99.98,
    judgeQueueMs: 420,
    tasksQueued: 7,
    checks: [
      { id: 'api', label: 'Public API', status: 'operational', detail: '184ms avg response' },
      { id: 'judge', label: 'Judge cluster', status: 'degraded', detail: '2 nodes draining' },
      { id: 'storage', label: 'Submission storage', status: 'operational', detail: '68% capacity used' },
    ],
  },
  moderationQueue: [
    { id: 's_9821', user: 'Alice Truong', issue: 'Possible plagiarism', problem: 'Multi-source shortest queries', severity: 'high', reportedAt: '2025-01-08T14:02:00Z' },
    { id: 's_9822', user: 'Nikhil P', issue: 'Manual regrade request', problem: 'LFU Cache', severity: 'medium', reportedAt: '2025-01-08T12:45:00Z' },
    { id: 's_9823', user: 'Grace Mills', issue: 'Flagged comment', problem: 'SQL Join Optimization', severity: 'low', reportedAt: '2025-01-08T10:11:00Z' },
  ],
  onboardingCohorts: [
    { id: 'cohort-1', course: 'CS204 Algorithms', owner: 'Dr. Patel', size: 38, status: 'Awaiting import', dueDate: '2025-01-12' },
    { id: 'cohort-2', course: 'Winter ICPC camp', owner: 'Coach Kim', size: 24, status: 'In review', dueDate: '2025-01-15' },
  ],
  accessRequests: [
    { id: 'req-1', requester: 'Ravi Shah', organization: 'GT Competitive Programming', reason: 'Need judge admin role', submittedAt: '2025-01-07T17:30:00Z', status: 'new' },
    { id: 'req-2', requester: 'Ling Wei', organization: 'CS101 TAs', reason: 'Enable broadcast announcements', submittedAt: '2025-01-07T09:15:00Z', status: 'new' },
  ],
  recentActivity: [
    { id: 'act-1', actor: 'Tam Nguyen', action: 'Published announcement', target: 'Spring Practice Contest', timestamp: '2025-01-08T13:20:00Z' },
    { id: 'act-2', actor: 'Leah Ortiz', action: 'Approved bulk account import', target: 'CS101 Cohort B', timestamp: '2025-01-08T11:05:00Z' },
    { id: 'act-3', actor: 'System', action: 'Auto-disabled submission', target: 'Suspected plagiarism', timestamp: '2025-01-08T08:55:00Z' },
  ],
};
