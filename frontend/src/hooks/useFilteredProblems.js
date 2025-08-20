import { useState, useMemo, useCallback } from 'react';

export function useFilteredProblems(problems = []) {
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [status, setStatus] = useState('all');
  const [tags, setTags] = useState([]);

  const filteredProblems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return problems.filter((p) => {
      const byQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.tags || []).some((t) => String(t).toLowerCase().includes(q));
      const byDiff =
        difficulty === 'all' ||
        String(p.difficulty || '').toLowerCase() === difficulty;
      const byStatus =
        status === 'all' ||
        (status === 'solved' && !!p.solved) ||
        (status === 'unsolved' && !p.solved);
      const byTags =
        tags.length === 0 ||
        (Array.isArray(p.tags) &&
          tags.every((t) => p.tags.map(String).includes(String(t))));
      return byQuery && byDiff && byStatus && byTags;
    });
  }, [problems, query, difficulty, status, tags]);

  const clearFilters = useCallback(() => {
    setQuery('');
    setDifficulty('all');
    setStatus('all');
    setTags([]);
  }, []);

  return {
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
  };
} 