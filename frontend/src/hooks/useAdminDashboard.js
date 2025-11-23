import { useState, useCallback, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { getAdminDashboard } from '../lib/api/admin';

export function useAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshedAt, setRefreshedAt] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await getAdminDashboard();
      setData(payload);
      setRefreshedAt(new Date());
    } catch (err) {
      setError(err?.message || 'Unable to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const lastUpdatedText = useMemo(() => {
    if (!refreshedAt) return 'Never';
    return formatDistanceToNow(refreshedAt, { addSuffix: true });
  }, [refreshedAt]);

  // Extract data fields
  const stats = data?.stats || [];
  const moderationQueue = data?.moderationQueue || [];
  const cohorts = data?.onboardingCohorts || [];
  const accessRequests = data?.accessRequests || [];
  const activity = data?.recentActivity || [];
  const usage = data?.usageBreakdown || [];
  const contestOps = data?.contestOps || [];
  const problemPipeline = data?.problemPipeline || [];
  const submissionFeed = data?.submissionFeed || [];
  const systemStatus = data?.systemStatus;

  return {
    data,
    loading,
    error,
    refreshedAt,
    lastUpdatedText,
    stats,
    moderationQueue,
    cohorts,
    accessRequests,
    activity,
    usage,
    contestOps,
    problemPipeline,
    submissionFeed,
    systemStatus,
    fetchDashboard,
  };
}

