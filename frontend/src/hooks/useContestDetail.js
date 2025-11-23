import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getContest,
  getContestProblems,
  getContestSubmissions,
  getContestRankings,
  getContestClarifications,
  joinContest,
} from '../lib/api/contests';
import { contests as mockContests, contestDetails as mockContestDetails } from '../lib/api/mockData';
import { getContestStatus } from '../utils/contestUtils';

export function useContestDetail(id) {
  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [clarifications, setClarifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submissionFilter, setSubmissionFilter] = useState({ 
    problem: 'all', 
    language: 'all', 
    status: 'all' 
  });

  const getMockContest = useCallback((contestId) => {
    const detail = mockContestDetails[contestId];
    if (detail) return detail;
    const summary = mockContests.find((c) => c.id === contestId);
    if (!summary) return null;
    return {
      id: summary.id,
      name: summary.name,
      format: summary.format,
      type: summary.type,
      start_time: summary.startTime,
      end_time: summary.endTime,
      time_limit: summary.timeLimitHours,
      tags: summary.tags,
      short_description: summary.shortDescription,
      status: summary.status,
      problems: [],
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const fallback = getMockContest(id);
    getContest(id)
      .then((res) => {
        if (res && Object.keys(res).length) {
          setContest(res);
        } else {
          setContest(fallback);
        }
      })
      .catch(() => setContest(fallback))
      .finally(() => setLoading(false));
  }, [getMockContest, id]);

  useEffect(() => {
    if (!contest || !id) return;

    // Load problems
    const fallbackProblems = (mockContestDetails[id]?.problems || []).map((title, index) => ({
      id: `${id}-p${index + 1}`,
      title,
      index: index + 1,
    }));
    getContestProblems(id)
      .then((res) => {
        const list = res?.problems || [];
        setProblems(list.length ? list : fallbackProblems);
      })
      .catch(() => setProblems(fallbackProblems));

    // Load clarifications
    getContestClarifications(id)
      .then((res) => setClarifications(res.clarifications || []))
      .catch(() => setClarifications([]));
  }, [contest, id]);

  const handleJoin = useCallback(async (isVirtual = false) => {
    if (!contest) return;
    try {
      await joinContest(contest.id, isVirtual);
      // Refresh contest data
      const updated = await getContest(id);
      setContest(updated);
    } catch (error) {
      console.error('Failed to join contest:', error);
    }
  }, [contest, id]);

  const loadSubmissions = useCallback(() => {
    if (!contest || !id) return;
    getContestSubmissions(id, submissionFilter)
      .then((res) => setSubmissions(res.submissions || []))
      .catch(() => setSubmissions([]));
  }, [contest, id, submissionFilter]);

  const loadRankings = useCallback(() => {
    if (!contest || !id) return;
    const status = getContestStatus(contest);
    if (status === 'ended' || status === 'running') {
      getContestRankings(id)
        .then((res) => setRankings(res.rankings || []))
        .catch(() => setRankings([]));
    }
  }, [contest, id]);

  const status = useMemo(() => getContestStatus(contest), [contest]);
  const isParticipating = contest?.is_participating || false;
  const showRankings = status === 'ended' || status === 'running';

  const contestRules = useMemo(() => {
    if (!contest?.rules) return [];
    return Array.isArray(contest.rules) ? contest.rules : [contest.rules];
  }, [contest]);

  const contestPrizes = useMemo(() => {
    if (!contest?.prizes) return [];
    return Array.isArray(contest.prizes) ? contest.prizes : [contest.prizes];
  }, [contest]);

  return {
    contest,
    problems,
    submissions,
    rankings,
    clarifications,
    loading,
    submissionFilter,
    setSubmissionFilter,
    status,
    isParticipating,
    showRankings,
    contestRules,
    contestPrizes,
    handleJoin,
    loadSubmissions,
    loadRankings,
  };
}

