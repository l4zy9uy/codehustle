import authBackground from '../assets/auth-background.jpg';
import logoImage from '../assets/logo.png';
import heroImage from '../assets/logo.jpg';

const announcements = [
  {
    id: 1,
    title: 'Judge maintenance window (Oct 15)',
    snippet: 'We will deploy a new sandbox image and need a short outage. Please plan submissions accordingly.',
    content: `### What is happening?

We're releasing a new sandbox image that includes a faster C++ toolchain and updated Python runtimes. To finish the rollout we need to pause submissions for *30 minutes*.

### Timeline

- **Start:** Oct 15, 2025 — 09:30 ICT
- **End:** Oct 15, 2025 — 10:00 ICT
- **Impact:** Submissions queued during the window will be auto-replayed.

### Action items

1. Avoid starting new contests during the window.
2. Share this notice with course cohorts (especially CS204 and CS301).
3. Watch the #status channel for live updates.

Thanks for your patience!
`,
    date: '2025-10-10T08:00:00Z',
    publishAt: '2025-10-10T08:00:00Z',
    updatedAt: '2025-10-10T08:30:00Z',
    author: 'Platform Ops',
    image: authBackground,
    status: 'published',
    audience: 'global',
    targets: ['All cohorts'],
    channels: ['web', 'email'],
    pinned: true,
  },
  {
    id: 2,
    title: 'CS301 contest schedule + resources',
    snippet: 'Week 5 introduces the ICPC-style checkpoint. Expect 4 problems covering flows and DP.',
    content: `Welcome back CS301 students! Here is what to expect this week:

#### Contest details

- **Name:** CS301 Checkpoint #2
- **Date:** Oct 11, 2025 (20:00–23:00 ICT)
- **Format:** IOI scoring, single account, no team submissions.
- **Topics:** Dinic, Min-Cost Max-Flow, DP optimization.

#### Preparation material

1. Review lecture slides 09–11.
2. Solve at least two practice problems from the *Flow Mastery* list.
3. Setup your workspace ahead of time. Late starts get fewer submissions.

As always, reach out on the course forum if you have questions.
`,
    date: '2025-10-08T05:00:00Z',
    publishAt: '2025-10-09T02:00:00Z',
    updatedAt: '2025-10-08T05:15:00Z',
    author: ['Dr. John Smith', 'TA Team'],
    image: logoImage,
    status: 'scheduled',
    audience: 'course',
    targets: ['CS301'],
    channels: ['web'],
    pinned: false,
  },
  {
    id: 3,
    title: 'Winter bootcamp registration opens',
    snippet: 'Sign-ups for the Competitive Programming Bootcamp (ICPC Elite) are now open until Oct 25.',
    content: `We are thrilled to open registration for the **ICPC Elite Winter Bootcamp**.

**Key dates:**

- Applications close *Oct 25*.
- Final roster announced *Oct 30*.
- Camp runs *Nov 5 – Dec 20* with daily virtual rounds.

**Eligibility:**

- Top 30% of CS301 standings
- ICPC team captains
- Or by recommendation from a lecturer/coach

Complete the form linked below and include your recent contest stats. Seats are limited!`,
    date: '2025-10-07T12:30:00Z',
    publishAt: '2025-10-07T12:30:00Z',
    updatedAt: '2025-10-07T13:00:00Z',
    author: 'Coach Lan Tran',
    image: heroImage,
    status: 'draft',
    audience: 'program',
    targets: ['ICPC Elite'],
    channels: ['web'],
    pinned: false,
  }
];

export default announcements; 
