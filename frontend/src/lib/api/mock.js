import AxiosMockAdapter from 'axios-mock-adapter';
import api from '../apiClient';
import {
  announcements,
  courses,
  courseInfo,
  courseProblems,
  problems,
  allTags,
  mockUser,
  mockStats,
  mockRecentSubmissions,
} from './mockData';

export function enableApiMocking() {
  const mock = new AxiosMockAdapter(api, { delayResponse: 400 });

  // Helpers
  const ok = (data = {}, status = 200, headers) => [status, data, headers];
  const noContent = () => [204];

  // Auth: login
  mock.onPost('/auth/login').reply((config) => {
    try {
      const body = JSON.parse(config.data || '{}');
      const { email, password } = body;
      if (!email || !password) return [400, { message: 'Missing credentials' }];
      // Simple demo rule: if password === 'wrong' fail
      if (password === 'wrong') return [401, { message: 'Invalid credentials' }];
      return ok({ token: 'mock-token', user: mockUser });
    } catch (e) {
      return [400, { message: 'Malformed JSON' }];
    }
  });

  // Auth: forgot password
  mock.onPost('/auth/forgot-password').reply((config) => {
    return noContent();
  });

  // Auth: me
  mock.onGet('/auth/me').reply((config) => {
    const auth = config.headers?.Authorization || config.headers?.authorization;
    if (!auth) return [401, { message: 'Unauthorized' }];
    return ok({ user: mockUser });
  });

  // Users (profile data)
  mock.onGet('/users/me/stats').reply(() => ok(mockStats));
  mock.onGet('/users/me/recent-submissions').reply(() => ok({ items: mockRecentSubmissions }));

  // Announcements
  mock.onGet('/announcements').reply(() => ok({ items: announcements }));
  mock.onGet(/\/announcements\/\d+$/).reply((config) => {
    const id = Number(config.url.split('/').pop());
    const item = announcements.find((a) => a.id === id);
    return item ? ok(item) : [404, { message: 'Announcement not found' }];
  });

  // Courses
  mock.onGet('/courses').reply(() => ok({ items: courses }));
  mock.onGet(/\/courses\/[^/]+$/).reply((config) => {
    const id = config.url.split('/').pop();
    const info = courseInfo[id];
    return info ? ok({ id, ...info }) : [404, { message: 'Course not found' }];
  });
  mock.onGet(/\/courses\/[^/]+\/problems$/).reply((config) => {
    const id = config.url.split('/')[2];
    const list = courseProblems[id] || [];
    return ok({ items: list });
  });

  // Problems
  mock.onGet('/problems').reply((config) => {
    const params = new URLSearchParams(config.params || {});
    const q = (params.get('q') || '').toLowerCase();
    const diff = (params.get('difficulty') || 'all').toLowerCase();
    const status = (params.get('status') || 'all').toLowerCase();
    const tagsParam = params.getAll('tags');
    const tagList = tagsParam.length ? tagsParam : (params.get('tags') || '').split(',').filter(Boolean);

    const filtered = problems.filter((p) => {
      const byQuery = !q || p.title.toLowerCase().includes(q) || (p.tags || []).some((t) => String(t).toLowerCase().includes(q));
      const byDiff = diff === 'all' || String(p.difficulty || '').toLowerCase() === diff;
      const byStatus = status === 'all' || (status === 'solved' && !!p.solved) || (status === 'unsolved' && !p.solved);
      const byTags = tagList.length === 0 || (Array.isArray(p.tags) && tagList.every((t) => p.tags.map(String).includes(String(t))));
      return byQuery && byDiff && byStatus && byTags;
    });
    return ok({ items: filtered });
  });

  mock.onGet(/\/problems\/[^/]+$/).reply((config) => {
    const slug = config.url.split('/').pop();
    const meta = problems.find((p) => p.slug === slug);
    if (!meta) return [404, { message: 'Problem not found' }];
    const detail = {
      id: meta.id || slug,
      slug: meta.slug,
      title: meta.title,
      difficulty: meta.difficulty,
      time_limit: 1,
      memory_limit_mb: 256,
      tags: meta.tags,
      solved_by_me: !!meta.solved,
      acceptance_rate: meta.acceptanceRate ?? 50,
      statement: {
        overview: `This is a mocked problem statement for ${meta.slug}.`,
        input: 'Mocked input specification.',
        output: 'Mocked output specification.',
        constraints: ['1 ≤ n ≤ 2e5', '-1e9 ≤ a[i] ≤ 1e9'],
      },
      samples: [
        { input_text: '2\n1 2\n3', output_text: '1\n' },
        { input_text: '3\n1 2 3\n4', output_text: '2\n' },
      ],
    };
    return ok(detail);
  });

  mock.onGet('/tags').reply(() => ok({ items: allTags }));

  // Submissions
  mock.onGet('/submissions').reply(() => ok({ items: mockRecentSubmissions }));
  mock.onGet(/\/submissions\/[^/]+$/).reply((config) => {
    const id = config.url.split('/').pop();
    const item = mockRecentSubmissions.find((s) => s.id === id) || {
      id,
      problemTitle: 'Unknown Problem',
      verdict: 'PENDING',
      language: 'C++17',
      submittedAt: new Date().toISOString(),
    };
    return ok(item);
  });
  mock.onPost('/submissions').reply(() => {
    const now = new Date().toISOString();
    const id = `s_${Math.random().toString(36).slice(2, 8)}`;
    const created = { id, verdict: 'AC', language: 'C++17', submittedAt: now };
    return ok(created, 201);
  });

  return mock;
}
