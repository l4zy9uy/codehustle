import React, { useEffect, useState } from 'react';
import { Container } from '@mantine/core';
import { useFilteredProblems } from '../hooks/useFilteredProblems';
import FilterToolbar from '../components/StudentHome/FilterToolbar';
import ProblemsTable from '../components/StudentHome/ProblemsTable';
import { getProblems, getTags } from '../lib/api/problems';

export default function Problems(props) {
  const { problems: incomingProblems = [], tagsOptions: incomingTagsOptions = [] } = props;
  const [problems, setProblems] = useState(incomingProblems);
  const [tagsOptions, setTagsOptions] = useState(incomingTagsOptions);

  // Initialize with default page parameters
  const [page] = useState(1);
  const [pageSize] = useState(25);

  // Filter state (separate from useFilteredProblems hook)
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [status, setStatus] = useState('all');
  const [tags, setTags] = useState([]);

  useEffect(() => {
    // Build API parameters with filters and pagination
    const apiParams = {
      page,
      page_size: pageSize
    };

    // Add filter parameters if they have values
    if (query.trim()) apiParams.q = query.trim();
    if (difficulty !== 'all') apiParams.difficulty = difficulty;
    if (status !== 'all') apiParams.status = status;
    if (tags.length > 0) apiParams.tags = tags;

    getProblems(apiParams)
      .then((res) => setProblems(res.problems || []))
      .catch(() => setProblems([]));
  }, [page, pageSize, query, difficulty, status, tags]); // Re-fetch when any filter or pagination changes

  useEffect(() => {
    getTags()
      .then((res) => setTagsOptions((res.items || []).map((t) => ({ value: t, label: t }))))
      .catch(() => setTagsOptions([]));
  }, []);

  // Use client-side filtering on top of server-side results
  const { filteredProblems } = useFilteredProblems(problems);

  // Custom clear filters function for server-side state
  const clearFilters = () => {
    setQuery('');
    setDifficulty('all');
    setStatus('all');
    setTags([]);
  };

  return (
    <Container maw={1024} mx="auto">
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
