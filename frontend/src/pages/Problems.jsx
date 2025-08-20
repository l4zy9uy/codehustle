import React from 'react';
import { useFilteredProblems } from '../hooks/useFilteredProblems';
import FilterToolbar from '../components/StudentHome/FilterToolbar';
import ProblemsTable from '../components/StudentHome/ProblemsTable';

export default function Problems(props) {
  const { problems = [], tagsOptions = [] } = props;
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
    <>
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