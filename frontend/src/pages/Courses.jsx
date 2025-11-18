import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  Paper,
  Progress,
  Select,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import {
  IconArrowRight,
  IconCalendarTime,
  IconSearch,
  IconUsers,
} from '@tabler/icons-react';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { getCourses } from '../lib/api/courses';
import { courses as mockCourses } from '../lib/api/mockData';

const statusMeta = {
  active: { label: 'Active now', color: 'teal' },
  upcoming: { label: 'Upcoming', color: 'blue' },
  completed: { label: 'Completed', color: 'gray' },
  draft: { label: 'Draft', color: 'yellow' },
};

const formatDate = (value) => {
  if (!value) return 'TBD';
  try {
    return format(parseISO(value), 'MMM d, yyyy');
  } catch {
    return value;
  }
};

export default function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [termFilter, setTermFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    getCourses()
      .then((res) => {
        if (cancelled) return;
        const apiCourses = res.items || [];
        setCourses(apiCourses.length ? apiCourses : mockCourses);
      })
      .catch(() => {
        if (cancelled) return;
        setCourses(mockCourses);
      });
    return () => { cancelled = true; };
  }, []);

  const computeStatus = useCallback((course) => {
    if (course.status) return course.status;
    const start = course.startDate ? parseISO(course.startDate) : null;
    const end = course.endDate ? parseISO(course.endDate) : null;
    const now = new Date();
    if (start && now < start) return 'upcoming';
    if (end && now > end) return 'completed';
    return 'active';
  }, []);

  const terms = useMemo(() => {
    const unique = new Set(courses.map((c) => c.term).filter(Boolean));
    return ['all', ...Array.from(unique)];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const status = computeStatus(course);
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      const matchesTerm = termFilter === 'all' || course.term === termFilter;
      const haystack = [course.title, course.lecturer, course.cohort, ...(course.tags || [])]
        .join(' ')
        .toLowerCase();
      const matchesSearch = haystack.includes(search.trim().toLowerCase());
      return matchesStatus && matchesTerm && matchesSearch;
    });
  }, [courses, computeStatus, search, statusFilter, termFilter]);

  const stats = useMemo(() => {
    const total = courses.length;
    const active = courses.filter((c) => computeStatus(c) === 'active').length;
    const upcoming = courses.filter((c) => computeStatus(c) === 'upcoming').length;
    const enrolledTotal = courses.reduce((acc, c) => acc + (c.enrolled || 0), 0);
    return {
      total,
      active,
      upcoming,
      avgEnrollment: total ? Math.round(enrolledTotal / total) : 0,
    };
  }, [computeStatus, courses]);

  const featuredCourse = useMemo(() => {
    const upcoming = [...filteredCourses]
      .filter((c) => computeStatus(c) === 'upcoming')
      .sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0));
    if (upcoming.length) return upcoming[0];
    return filteredCourses[0] || null;
  }, [computeStatus, filteredCourses]);

  return (
    <Stack gap="lg">
      <div>
        <Text c="dimmed" size="sm">Learning tracks</Text>
        <Text fw={700} size="xl">Courses & cohorts</Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <Paper withBorder radius="md" p="md">
          <Text size="sm" c="dimmed">Active courses</Text>
          <Text fw={700} size="lg">{stats.active}</Text>
          <Text size="xs" c="dimmed">of {stats.total} tracked</Text>
        </Paper>
        <Paper withBorder radius="md" p="md">
          <Text size="sm" c="dimmed">Upcoming launches</Text>
          <Text fw={700} size="lg">{stats.upcoming}</Text>
          <Text size="xs" c="dimmed">ready for onboarding</Text>
        </Paper>
        <Paper withBorder radius="md" p="md">
          <Text size="sm" c="dimmed">Avg enrollment</Text>
          <Text fw={700} size="lg">{stats.avgEnrollment}</Text>
          <Text size="xs" c="dimmed">students per course</Text>
        </Paper>
        <Paper withBorder radius="md" p="md">
          <Text size="sm" c="dimmed">Catalog size</Text>
          <Text fw={700} size="lg">{stats.total}</Text>
          <Text size="xs" c="dimmed">total cohorts</Text>
        </Paper>
      </SimpleGrid>

      <Group align="flex-end" justify="space-between" wrap="wrap" gap="md">
        <TextInput
          placeholder="Search title, lecturer, tag..."
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          w={{ base: '100%', sm: 260 }}
        />
        <Group gap="sm" wrap="wrap">
          <Select
            data={terms.map((term) => ({ value: term, label: term === 'all' ? 'All terms' : term }))}
            value={termFilter}
            onChange={(value) => setTermFilter(value || 'all')}
            label="Term"
            w={{ base: '100%', sm: 180 }}
          />
          <SegmentedControl
            fullWidth={false}
            value={statusFilter}
            onChange={setStatusFilter}
            data={[
              { label: 'All', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Upcoming', value: 'upcoming' },
              { label: 'Completed', value: 'completed' },
            ]}
          />
        </Group>
      </Group>

      {featuredCourse && (
        <Card withBorder radius="md" p="lg" style={{ background: 'linear-gradient(135deg, var(--mantine-color-blue-0), var(--mantine-color-blue-1))' }}>
          <Group align="flex-start" justify="space-between" wrap="wrap">
            <Stack gap={4}>
              <Text size="xs" fw={700} c="blue.8">Next cohort</Text>
              <Text size="lg" fw={700}>{featuredCourse.title}</Text>
              <Text size="sm" c="dimmed">Starts {formatDate(featuredCourse.startDate)} • {featuredCourse.cohort}</Text>
              <Text size="sm">{featuredCourse.summary}</Text>
            </Stack>
            <Button rightSection={<IconArrowRight size={16} />} onClick={() => navigate(`/courses/${featuredCourse.id}`)}>
              View details
            </Button>
          </Group>
        </Card>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg">
        {filteredCourses.map((course) => {
          const status = computeStatus(course);
          const statusBadge = statusMeta[status] || statusMeta.active;
          const progress = typeof course.progress === 'number' ? Math.min(Math.max(course.progress, 0), 1) : null;
          return (
            <Card key={course.id} withBorder radius="md" padding="lg" shadow="sm">
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Anchor
                      component="button"
                      onClick={() => navigate(`/courses/${course.id}`)}
                      style={{
                        fontWeight: 700,
                        color: 'var(--mantine-color-blue-7)',
                        textDecoration: 'none',
                        padding: 0,
                      }}
                      onMouseEnter={(event) => { event.currentTarget.style.textDecoration = 'underline'; }}
                      onMouseLeave={(event) => { event.currentTarget.style.textDecoration = 'none'; }}
                    >
                      {course.title}
                    </Anchor>
                    <Text size="sm" c="dimmed">{course.lecturer} • {course.cohort || '—'}</Text>
                    <Text size="xs" c="blue.6">Click course name to open</Text>
                  </div>
                  <Badge color={statusBadge.color} variant="light">{statusBadge.label}</Badge>
                </Group>

                <Group gap="xs" wrap="wrap">
                  {course.tags?.map((tag) => (
                    <Badge key={tag} color="gray" variant="light" size="sm">{tag}</Badge>
                  ))}
                </Group>

                <Text size="sm">{course.summary}</Text>

                <Group gap="lg" wrap="wrap">
                  <Group gap={6}>
                    <IconUsers size={16} />
                    <Text size="sm">{course.enrolled || 0}/{course.capacity || '—'} enrolled</Text>
                  </Group>
                  <Group gap={6}>
                    <IconCalendarTime size={16} />
                    <Text size="sm">{formatDate(course.startDate)} - {formatDate(course.endDate)}</Text>
                  </Group>
                </Group>

                {progress !== null && (
                  <div>
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">Progress</Text>
                      <Text size="xs" c="dimmed">{Math.round(progress * 100)}%</Text>
                    </Group>
                    <Progress value={progress * 100} mt={4} />
                  </div>
                )}

                {course.nextMilestone && (
                  <Text size="xs" c="dimmed">Next: {course.nextMilestone}</Text>
                )}

                <Text size="xs" c="dimmed">
                  Updated {course.updatedAt ? formatDistanceToNowStrict(new Date(course.updatedAt), { addSuffix: true }) : 'recently'}
                </Text>
              </Stack>
            </Card>
          );
        })}
      </SimpleGrid>

      {!filteredCourses.length && (
        <Paper withBorder p="xl" radius="md">
          <Stack align="center" gap="xs">
            <Text fw={600}>No courses match your filters</Text>
            <Text size="sm" c="dimmed">Try clearing the search or selecting another term.</Text>
            <Button variant="light" onClick={() => { setSearch(''); setTermFilter('all'); setStatusFilter('all'); }}>
              Reset filters
            </Button>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
