import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Anchor,
  Badge,
  Breadcrumbs,
  Divider,
  Grid,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconBook, IconChartBar, IconClipboardList, IconTrophy, IconUsers, IconCalendarTime } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import FilterToolbar from '../components/StudentHome/FilterToolbar';
import ProblemsTable from '../components/StudentHome/ProblemsTable';
import { useFilteredProblems } from '../hooks/useFilteredProblems';
import { getCourse, getCourseProblems } from '../lib/api/courses';
import { courses as mockCourses, courseInfo as mockCourseInfo, courseProblems as mockCourseProblems } from '../lib/api/mockData';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { usePageTitle } from '../hooks/usePageTitle';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [problems, setProblems] = useState([]);

  const getMockCourse = useCallback((courseId) => {
    const courseMeta = mockCourses.find((c) => c.id === courseId);
    const mock = mockCourseInfo[courseId];
    if (!mock) return null;
    return { id: courseId, ...courseMeta, ...mock };
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fallbackCourse = getMockCourse(id);
    const fallbackProblems = mockCourseProblems[id] || [];

    getCourse(id)
      .then((res) => {
        if (cancelled) return;
        if (res && Object.keys(res).length) {
          setCourse(res);
        } else {
          setCourse(fallbackCourse);
        }
      })
      .catch(() => {
        if (!cancelled) setCourse(fallbackCourse);
      });
  }, [id, getMockCourse]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fallbackProblems = mockCourseProblems[id] || [];

    getCourseProblems(id)
      .then((res) => {
        if (cancelled) return;
        const items = res?.items || [];
        setProblems(items.length ? items : fallbackProblems);
      })
      .catch(() => {
        if (!cancelled) setProblems(fallbackProblems);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  usePageTitle(course?.name ? `${course.name} - Course` : 'Course');

  const {
    query,
    setQuery,
    difficulty,
    setDifficulty,
    status,
    setStatus,
    tags,
    setTags,
    filteredProblems,
    clearFilters,
  } = useFilteredProblems(problems);

  const tagsOptions = useMemo(() => {
    const set = new Set();
    problems.forEach((p) => (p.tags || []).forEach((t) => set.add(String(t))));
    return Array.from(set).sort().map((t) => ({ value: t, label: t }));
  }, [problems]);

  const solvedCount = useMemo(() => problems.filter((p) => !!p.solved).length, [problems]);
  const totalCount = problems.length;
  const pct = totalCount ? Math.round((solvedCount / totalCount) * 100) : 0;

  if (!course) {
    return (
      <>
        <Breadcrumbs mb="sm">
          <Anchor href="/courses">Courses</Anchor>
          <Text c="dimmed">Not found</Text>
        </Breadcrumbs>
        <Title order={2}>Course not found</Title>
        <Text c="dimmed" mt="xs">We couldn't find this course. Please go back to Courses.</Text>
      </>
    );
  }

  const extraStats = {
    enrolled: course.enrolled ?? 0,
    capacity: course.capacity ?? 0,
    mode: course.mode || 'Mixed',
    tags: course.tags || [],
    nextMilestone: course.nextMilestone || 'Stay tuned for next update',
    updatedAt: course.updatedAt,
  };

  const renderStatCard = (label, value, icon) => (
    <Paper withBorder radius="md" p="md">
      <Group gap="sm" align="flex-start">
        <ThemeIcon radius="md" size="lg" variant="light">
          {icon}
        </ThemeIcon>
        <Stack gap={2}>
          <Text size="xs" c="dimmed">{label}</Text>
          <Text fw={700}>{value}</Text>
        </Stack>
      </Group>
    </Paper>
  );

  const updatedLabel = extraStats.updatedAt
    ? formatDistanceToNow(typeof extraStats.updatedAt === 'string' ? parseISO(extraStats.updatedAt) : new Date(extraStats.updatedAt), { addSuffix: true })
    : 'recently';

  return (
    <>
      <Breadcrumbs mb="xs">
        <Anchor href="/courses">Courses</Anchor>
        <Text c="dimmed">{course.title}</Text>
      </Breadcrumbs>

      <Stack gap="xs" mb="sm">
        <Title order={2}>{course.title}</Title>
        <Text c="dimmed">Lecturer: {course.lecturer} · Term: {course.term}</Text>
      </Stack>

      <Grid gutter="md" mb="md">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper withBorder radius="md" p="md">
            <Group justify="space-between" align="flex-start" mb="sm">
              <Stack gap={2}>
                <Text size="sm" c="dimmed">Course overview</Text>
                <Title order={4}>Description</Title>
              </Stack>
              <Badge color="blue" variant="light">{extraStats.mode}</Badge>
            </Group>
            <Divider mb="sm" />
            <Text>{course.description}</Text>
            <Group mt="md" gap="sm" wrap="wrap">
              {extraStats.tags.map((tag) => (
                <Badge key={tag} variant="light">{tag}</Badge>
              ))}
            </Group>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="sm">
            {renderStatCard('Enrolled', `${extraStats.enrolled}/${extraStats.capacity || '∞'}`, <IconUsers size={16} />)}
            {renderStatCard('Next milestone', extraStats.nextMilestone, <IconClipboardList size={16} />)}
            {renderStatCard('Last updated', updatedLabel, <IconCalendarTime size={16} />)}
          </Stack>
        </Grid.Col>
      </Grid>

      <Paper withBorder radius="md" p="md" mb="md">
        <Group justify="space-between" align="center">
          <Text fw={600}>Practice Progress</Text>
          <Text size="sm" c="dimmed">Solved {solvedCount} / {totalCount} ({pct}%)</Text>
        </Group>
        <Progress value={pct} mt="sm" />
      </Paper>

      <FilterToolbar
        query={query}
        setQuery={setQuery}
        count={filteredProblems.length}
        clearFilters={clearFilters}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        status={status}
        setStatus={setStatus}
        tags={tags}
        setTags={setTags}
        tagsOptions={tagsOptions}
      />

      <ProblemsTable problems={filteredProblems} />
    </>
  );
}
