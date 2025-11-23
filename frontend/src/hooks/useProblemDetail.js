import { useState, useEffect, useMemo } from 'react';
import { getProblem } from '../lib/api/problems';

export function useProblemDetail(slug, incomingProblem) {
  const [fetchedProblem, setFetchedProblem] = useState(null);
  const [loading, setLoading] = useState(!incomingProblem);

  useEffect(() => {
    if (!incomingProblem && slug) {
      setLoading(true);
      getProblem(slug)
        .then(setFetchedProblem)
        .catch(() => setFetchedProblem(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [incomingProblem, slug]);

  const problem = useMemo(
    () => incomingProblem || fetchedProblem || {},
    [incomingProblem, fetchedProblem]
  );

  const memLimit =
    problem.memory_limit_mb !== undefined && problem.memory_limit_mb !== null
      ? `${problem.memory_limit_mb} MB`
      : undefined;
  const accRate =
    problem.acceptance_rate !== undefined && problem.acceptance_rate !== null
      ? `${Number(problem.acceptance_rate).toFixed(1)}%`
      : undefined;
  const timeLimit =
    problem.time_limit !== undefined && problem.time_limit !== null
      ? `${problem.time_limit} s`
      : undefined;

  return {
    problem,
    loading,
    memLimit,
    accRate,
    timeLimit,
  };
}

