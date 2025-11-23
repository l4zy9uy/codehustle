import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useSubmissionExpansion() {
  const [expandedId, setExpandedId] = useState(null);
  const [loadingMap, setLoadingMap] = useState({});
  const [showMoreMap, setShowMoreMap] = useState({});
  const [openInputMap, setOpenInputMap] = useState({});
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!searchParams || typeof searchParams.get !== 'function') return;
    const sid = searchParams.get('sid');
    if (sid) setExpandedId(sid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function syncUrl(nextId) {
    try {
      const url = new URL(window.location.href);
      if (nextId) url.searchParams.set('sid', nextId); else url.searchParams.delete('sid');
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore URL persistence errors
    }
  }

  function toggleExpand(submission) {
    const willExpand = expandedId !== submission.id;
    const nextId = willExpand ? submission.id : null;
    setExpandedId(nextId);
    syncUrl(nextId);
    if (willExpand) {
      setLoadingMap((m) => ({ ...m, [submission.id]: true }));
      setTimeout(() => setLoadingMap((m) => ({ ...m, [submission.id]: false })), 300);
    }
  }

  function truncate(text, limit) {
    if (!text) return '';
    if (text.length <= limit) return text;
    return text.slice(0, limit) + '\n…';
  }

  return {
    expandedId,
    setExpandedId,
    loadingMap,
    setLoadingMap,
    showMoreMap,
    setShowMoreMap,
    openInputMap,
    setOpenInputMap,
    toggleExpand,
    truncate,
  };
}

