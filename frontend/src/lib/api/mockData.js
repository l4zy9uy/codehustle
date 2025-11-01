// Centralized mock datasets used by axios-mock-adapter.
// Reuse existing local demo data where available.

import announcements from '../../data/announcements';

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
  { id: '1', title: 'Introduction to Data Structures', lecturer: 'Prof. Jane Doe', startDate: '01 Sep 2025', endDate: '31 Dec 2025' },
  { id: '2', title: 'Advanced Algorithms', lecturer: 'Dr. John Smith', startDate: '15 Aug 2025', endDate: '30 Nov 2025' },
  { id: '3', title: 'Database Systems', lecturer: 'Ms. Alice Nguyen', startDate: '10 Oct 2025', endDate: '20 Jan 2026' },
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

export { announcements };
