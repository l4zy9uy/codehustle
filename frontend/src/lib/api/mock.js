import AxiosMockAdapter from 'axios-mock-adapter';
import api from '../apiClient';
import {
  announcements,
  courses,
  contests,
  contestDetails,
  courseInfo,
  courseProblems,
  problems,
  allTags,
  mockUser,
  mockStats,
  mockRecentSubmissions,
  adminDashboard,
} from './mockData';

export function enableApiMocking() {
  const mock = new AxiosMockAdapter(api, { delayResponse: 400 });

  // Helpers
  const ok = (data = {}, status = 200, headers) => [status, data, headers];
  const noContent = () => [204];
  let announcementStore = announcements.map((entry) => ({ ...entry }));

  const parseJson = (config) => {
    try {
      return JSON.parse(config.data || '{}');
    } catch (err) {
      return {};
    }
  };

  const normalizeTargets = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  };

  const nextAnnouncementId = () => {
    const currentMax = announcementStore.reduce((max, item) => {
      const idNum = Number(item.id) || 0;
      return Math.max(max, idNum);
    }, 0);
    return currentMax + 1;
  };

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
  mock.onGet('/announcements').reply(() => ok({ items: announcementStore }));
  mock.onGet(/\/announcements\/\d+$/).reply((config) => {
    const id = Number(config.url.split('/').pop());
    const item = announcementStore.find((a) => Number(a.id) === id);
    return item ? ok(item) : [404, { message: 'Announcement not found' }];
  });
  mock.onPost('/announcements').reply((config) => {
    const body = parseJson(config);
    const now = new Date().toISOString();
    const publishAt = body.publishAt || body.date || now;
    const newAnnouncement = {
      id: nextAnnouncementId(),
      title: body.title || 'Untitled announcement',
      snippet: body.snippet || '',
      content: body.content || '',
      author: body.author || 'Admin',
      image: body.image || null,
      status: body.status || 'draft',
      audience: body.audience || 'global',
      targets: normalizeTargets(body.targets || body.targetsInput),
      channels: Array.isArray(body.channels) && body.channels.length ? body.channels : ['web'],
      pinned: !!body.pinned,
      date: publishAt,
      publishAt,
      updatedAt: now,
    };
    announcementStore = [newAnnouncement, ...announcementStore];
    return ok(newAnnouncement, 201);
  });
  mock.onPut(/\/announcements\/\d+$/).reply((config) => {
    const id = Number(config.url.split('/').pop());
    const current = announcementStore.find((item) => Number(item.id) === id);
    if (!current) return [404, { message: 'Announcement not found' }];
    const body = parseJson(config);
    const now = new Date().toISOString();
    const publishAt = body.publishAt || body.date || current.publishAt || current.date || now;
    const updatedAnnouncement = {
      ...current,
      ...body,
      targets: normalizeTargets(body.targets ?? current.targets),
      channels: Array.isArray(body.channels) ? body.channels : current.channels,
      date: publishAt,
      publishAt,
      updatedAt: now,
    };
    announcementStore = announcementStore.map((item) => (Number(item.id) === id ? updatedAnnouncement : item));
    return ok(updatedAnnouncement);
  });
  mock.onDelete(/\/announcements\/\d+$/).reply((config) => {
    const id = Number(config.url.split('/').pop());
    const exists = announcementStore.some((item) => Number(item.id) === id);
    if (!exists) return [404, { message: 'Announcement not found' }];
    announcementStore = announcementStore.filter((item) => Number(item.id) !== id);
    return noContent();
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

  // Contests
  const formatContest = (contest) => ({
    id: contest.id,
    name: contest.name,
    type: contest.type,
    format: contest.format,
    status: contest.status,
    start_time: contest.startTime,
    end_time: contest.endTime,
    time_limit: contest.timeLimitHours,
    duration: contest.duration,
    participants: contest.participants,
    is_mirror: contest.isMirror,
    tags: contest.tags,
    short_description: contest.shortDescription,
  });

  mock.onGet('/contests').reply((config) => {
    const params = new URLSearchParams(config.params || {});
    const q = (params.get('q') || '').toLowerCase();
    const page = parseInt(params.get('page') || '1');
    const pageSize = parseInt(params.get('page_size') || '50');
    const filtered = contests.filter((contest) => {
      if (!q) return true;
      const haystack = [contest.name, contest.shortDescription, ...(contest.tags || [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
    const startIndex = (page - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize).map(formatContest);
    return ok({ contests: paginated, total: filtered.length, page, page_size: pageSize });
  });

  mock.onGet(/\/contests\/[^/]+$/).reply((config) => {
    const id = config.url.split('/').pop();
    const detail = contestDetails[id];
    if (!detail) return [404, { message: 'Contest not found' }];
    return ok({ ...formatContest(detail), rules: detail.rules, prizes: detail.prizes, problems: detail.problems });
  });

  mock.onGet(/\/contests\/[^/]+\/problems$/).reply((config) => {
    const id = config.url.split('/')[2];
    const detail = contestDetails[id];
    const problemsList = (detail?.problems || []).map((title, index) => ({
      id: `${id}-p${index + 1}`,
      title,
      index: index + 1,
    }));
    return ok({ problems: problemsList });
  });

  // Problems
  mock.onGet('/problems').reply((config) => {
    const params = new URLSearchParams(config.params || {});
    const q = (params.get('q') || '').toLowerCase();
    const diff = (params.get('difficulty') || 'all').toLowerCase();
    const status = (params.get('status') || 'all').toLowerCase();
    const tagsParam = params.getAll('tags');
    const tagList = tagsParam.length ? tagsParam : (params.get('tags') || '').split(',').filter(Boolean);
    const page = parseInt(params.get('page') || '1');
    const page_size = parseInt(params.get('page_size') || '50');

    const filtered = problems.filter((p) => {
      const byQuery = !q || p.title.toLowerCase().includes(q) || (p.tags || []).some((t) => String(t).toLowerCase().includes(q));
      const byDiff = diff === 'all' || String(p.difficulty || '').toLowerCase() === diff;
      const byStatus = status === 'all' || (status === 'solved' && !!p.solved) || (status === 'unsolved' && !p.solved);
      const byTags = tagList.length === 0 || (Array.isArray(p.tags) && tagList.every((t) => p.tags.map(String).includes(String(t))));
      return byQuery && byDiff && byStatus && byTags;
    });

    // Convert to new API format
    const problemsFormatted = filtered.map(p => ({
      slug: p.slug,
      name: p.title,
      tags: p.tags || [],
      diff: p.difficulty?.toLowerCase() || 'easy',
      // Include additional fields that the table expects
      solved: p.solved || false,
      acceptanceRate: p.acceptanceRate || 50,
      solvedCount: p.solvedCount || Math.round(((p.acceptanceRate || 50) / 100) * 5000),
      index: p.index
    }));

    // Simple pagination
    const startIndex = (page - 1) * page_size;
    const endIndex = startIndex + page_size;
    const paginatedProblems = problemsFormatted.slice(startIndex, endIndex);

    return ok({
      problems: paginatedProblems,
      total: problemsFormatted.length,
      page: page,
      page_size: page_size
    });
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

  // Admin Dashboard
  mock.onGet('/admin/dashboard').reply(() => ok(adminDashboard));

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
