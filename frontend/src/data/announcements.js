import authBackground from '../assets/auth-background.jpg';
import logoImage from '../assets/logo.png';
import heroImage from '../assets/logo.jpg';

const announcements = [
  {
    id: 1,
    title: 'System maintenance scheduled',
    snippet: 'A short snippet preview of the announcement goes here...',
    content: `
<p><strong>Heads up!</strong> We will perform routine maintenance on <em>Saturday, Aug 24</em> from <code>01:00-03:00 UTC</code>. During this window, judge services will be <span style="color:red;">temporarily unavailable</span>.</p>
<ul>
  <li>Submissions will be queued and re-run after downtime.</li>
  <li>Scoreboards will freeze 15 minutes prior.</li>
  <li>Check the <a href="https://status.example.com">status page</a> for updates.</li>
</ul>
<p>Thank you for your patience.</p>
`,
    date: '2025-08-20T00:00:00Z',
    publishAt: '2025-08-20T00:00:00Z',
    updatedAt: '2025-08-20T01:00:00Z',
    author: 'Admin',
    image: authBackground,
    status: 'published',
    audience: 'global',
    targets: ['All cohorts'],
    channels: ['web', 'email'],
    pinned: true,
    read: false,
  },
  {
    id: 2,
    title: 'Welcome to the new semester',
    snippet: 'Another snippet preview for a read announcement...',
    content: `
<p>Welcome to the new semester! Here are the updates and resources you need:</p>
<ol>
  <li>Review the <a href="/syllabus">syllabus</a> and weekly milestones.</li>
  <li>Join the <strong>Discord</strong> for office hours.</li>
  <li>Browse the <em>starter problems</em> tagged <code>intro</code>.</li>
</ol>
<blockquote>“Success is the sum of small efforts, repeated day in and day out.”</blockquote>
`,
    date: '2025-08-15T00:00:00Z',
    publishAt: '2025-08-15T00:00:00Z',
    updatedAt: '2025-08-15T01:00:00Z',
    author: 'Lecturer',
    image: logoImage,
    status: 'published',
    audience: 'course',
    targets: ['New semester'],
    channels: ['web'],
    pinned: false,
    read: true,
  },
  {
    id: 3,
    title: 'Winter bootcamp registration opens',
    snippet: 'Sign-ups for the Competitive Programming Bootcamp (ICPC Elite) are now open until Oct 25.',
    content: `
<p>We are thrilled to open registration for the <strong>ICPC Elite Winter Bootcamp</strong>.</p>

<p><strong>Key dates:</strong></p>
<ul>
  <li>Applications close <em>Oct 25</em>.</li>
  <li>Final roster announced <em>Oct 30</em>.</li>
  <li>Camp runs <em>Nov 5 – Dec 20</em> with daily virtual rounds.</li>
</ul>

<p><strong>Eligibility:</strong></p>
<ul>
  <li>Top 30% of CS301 standings</li>
  <li>ICPC team captains</li>
  <li>Or recommendation from a lecturer/coach</li>
</ul>

<p>Complete the form linked below and include your recent contest stats. Seats are limited!</p>
`,
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
    read: false,
  }
];

export default announcements; 
