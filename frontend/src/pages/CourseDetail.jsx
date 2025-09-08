import React, { useEffect, useMemo, useState } from 'react';
import { Breadcrumbs, Anchor, Container, Title, Text, Stack, Group, Paper, Divider } from '@mantine/core';
import { useParams } from 'react-router-dom';
import FilterToolbar from '../components/StudentHome/FilterToolbar';
import ProblemsTable from '../components/StudentHome/ProblemsTable';
import { useFilteredProblems } from '../hooks/useFilteredProblems';
import { getCourse, getCourseProblems } from '../lib/api/courses';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [problems, setProblems] = useState([]);

  useEffect(() => {
    if (!id) return;
    getCourse(id)
      .then(setCourse)
      .catch(() => setCourse(null));
    getCourseProblems(id)
      .then((res) => setProblems(res.items || []))
      .catch(() => setProblems([]));
  }, [id]);

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
      <Container size={1080} p="md">
        <Breadcrumbs mb="sm">
          <Anchor href="/courses">Courses</Anchor>
          <Text c="dimmed">Not found</Text>
        </Breadcrumbs>
        <Title order={2}>Course not found</Title>
        <Text c="dimmed" mt="xs">We couldn’t find this course. Please go back to Courses.</Text>
      </Container>
    );
  }

  return (
    <Container size={1080} p="md">
      <Breadcrumbs mb="xs">
        <Anchor href="/courses">Courses</Anchor>
        <Text c="dimmed">{course.title}</Text>
      </Breadcrumbs>

      <Stack gap="xs" mb="sm">
        <Title order={2}>{course.title}</Title>
        <Text c="dimmed">Lecturer: {course.lecturer} · Term: {course.term}</Text>
      </Stack>

      <Paper withBorder radius="sm" p="md" mb="sm">
        <Title order={4} mb={4}>Course Description</Title>
        <Divider mb="sm" />
        <Text>{course.description}</Text>
      </Paper>

      <Paper withBorder radius="sm" p="sm" mb="xs">
        <Text fw={600}>Practice Progress: Solved {solvedCount} / {totalCount} ({pct}%)</Text>
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
    </Container>
  );
}
