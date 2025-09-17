import React, { useEffect, useMemo, useState } from 'react';
import { Container } from '@mantine/core';
import { useFilteredProblems } from '../hooks/useFilteredProblems';
import FilterToolbar from '../components/StudentHome/FilterToolbar';
import ProblemsTable from '../components/StudentHome/ProblemsTable';
import { getProblems, getTags } from '../lib/api/problems';

export default function Problems(props) {
  const { problems: incomingProblems = [], tagsOptions: incomingTagsOptions = [] } = props;
  const [problems, setProblems] = useState(incomingProblems);
  const [tagsOptions, setTagsOptions] = useState(incomingTagsOptions);

  useEffect(() => {
    getProblems()
      .then((res) => setProblems(res.items || []))
      .catch(() => setProblems([]));
    getTags()
      .then((res) => setTagsOptions((res.items || []).map((t) => ({ value: t, label: t }))))
      .catch(() => setTagsOptions([]));
  }, []);
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
    clearFilters
  } = useFilteredProblems(problems);

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
