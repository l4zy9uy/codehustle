// StudentHome.jsx — Desktop layout only (Mantine v7, JSX)
// Rules implemented:
// - Assignments = Problems; Courses exist but not shown here
// - Filters toolbar is sticky; no search in navbar
// - Difficulty & Status are simple color-coded lists (chips), not segmented controls
// - "Solved" is marked inline next to the problem title (and the title is the link)
// - Frame squarer than inner UI (radius: Paper 'sm', controls/chips 'xl')

import React from 'react';
import { useFilteredProblems } from '../hooks/useFilteredProblems';
import FilterToolbar from '../components/StudentHome/FilterToolbar';
import ProblemsTable from '../components/StudentHome/ProblemsTable';

export default function StudentHome(props) {
  const { problems = [], tagsOptions = [] } = props;
  const { query, setQuery, difficulty, setDifficulty, status, setStatus, tags, setTags, filteredProblems, clearFilters } = useFilteredProblems(problems);

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
