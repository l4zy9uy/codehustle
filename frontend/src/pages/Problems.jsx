import React, { useEffect, useState } from 'react';
import { Container, Pagination } from '@mantine/core';
import FilterToolbar from '../components/StudentHome/FilterToolbar';
import ProblemsTable from '../components/StudentHome/ProblemsTable';
import { getProblems, getTags } from '../lib/api/problems';

export default function Problems(props) {
  const { problems: incomingProblems = [], tagsOptions: incomingTagsOptions = [] } = props;
  const [problems, setProblems] = useState(incomingProblems);
  const [tagsOptions, setTagsOptions] = useState(incomingTagsOptions);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);

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
      .then((res) => {
        setProblems(res.problems || []);
        setTotal(res.total || 0);
      })
      .catch(() => {
        setProblems([]);
        setTotal(0);
      });
  }, [page, pageSize, query, difficulty, status, tags]); // Re-fetch when any filter or pagination changes

  // Reset to page 1 when filters change
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, difficulty, status, tags]);

  useEffect(() => {
    getTags()
      .then((res) => setTagsOptions((res.items || []).map((t) => ({ value: t, label: t }))))
      .catch(() => setTagsOptions([]));
  }, []);

  // Custom clear filters function for server-side state
  const clearFilters = () => {
    setQuery('');
    setDifficulty('all');
    setStatus('all');
    setTags([]);
  };

  // Calculate total pages
  const totalPages = Math.ceil(total / pageSize);

  return (
    <Container maw={1024} mx="auto">
      <FilterToolbar
        query={query}
        setQuery={setQuery}
        count={total}
        clearFilters={clearFilters}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        status={status}
        setStatus={setStatus}
        tags={tags}
        setTags={setTags}
        tagsOptions={tagsOptions}
      />
      <ProblemsTable problems={problems} page={page} pageSize={pageSize} />
      {totalPages > 1 && (
        <Pagination
          value={page}
          onChange={setPage}
          total={totalPages}
          mt="md"
          size="sm"
          position="center"
        />
      )}
    </Container>
  );
}
