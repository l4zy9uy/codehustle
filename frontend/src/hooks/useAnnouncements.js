import { useState, useCallback, useEffect, useMemo } from 'react';
import { createAnnouncement, deleteAnnouncement, getAnnouncements, updateAnnouncement } from '../lib/api/announcements';
import { defaultAnnouncementForm } from '../constants/admin';
import { toInputDateValue, fromInputDateValue } from '../utils/dateUtils';

export function useAnnouncements() {
  const [announcementsItems, setAnnouncementsItems] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState(null);
  const [announcementFilter, setAnnouncementFilter] = useState('all');
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerSaving, setComposerSaving] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [composerValues, setComposerValues] = useState(defaultAnnouncementForm);

  const fetchAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    setAnnouncementsError(null);
    try {
      const payload = await getAnnouncements({ scope: 'admin' });
      setAnnouncementsItems(payload.items || []);
    } catch (err) {
      setAnnouncementsError(err?.message || 'Unable to load announcements');
    } finally {
      setAnnouncementsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const filteredAnnouncements = useMemo(() => {
    const query = announcementSearch.trim().toLowerCase();
    return announcementsItems.filter((item) => {
      const status = (item.status || 'draft').toLowerCase();
      const matchesStatus = announcementFilter === 'all' || status === announcementFilter;
      const haystack = [
        item.title,
        item.snippet,
        Array.isArray(item.author) ? item.author.join(' ') : item.author,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [announcementsItems, announcementFilter, announcementSearch]);

  const sortedAnnouncements = useMemo(() => {
    const list = [...filteredAnnouncements];
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const aDate = new Date(a.publishAt || a.date || 0).getTime();
      const bDate = new Date(b.publishAt || b.date || 0).getTime();
      return bDate - aDate;
    });
  }, [filteredAnnouncements]);

  const announcementStats = useMemo(() => {
    return announcementsItems.reduce((acc, item) => {
      const key = (item.status || 'draft').toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [announcementsItems]);

  useEffect(() => {
    if (!announcementsItems.length) {
      setSelectedAnnouncement(null);
      return;
    }
    setSelectedAnnouncement((prev) => {
      if (!prev) return announcementsItems[0];
      const match = announcementsItems.find((item) => item.id === prev.id);
      return match || announcementsItems[0];
    });
  }, [announcementsItems]);

  useEffect(() => {
    if (!selectedAnnouncement) return;
    const exists = filteredAnnouncements.some((item) => item.id === selectedAnnouncement.id);
    if (!exists) {
      setSelectedAnnouncement(filteredAnnouncements[0] || null);
    }
  }, [filteredAnnouncements, selectedAnnouncement]);

  const resetComposer = useCallback(() => {
    setComposerValues({
      ...defaultAnnouncementForm,
      author: 'Platform Ops',
    });
    setEditingAnnouncement(null);
  }, []);

  const openComposer = useCallback((announcement = null) => {
    if (announcement) {
      setComposerValues({
        title: announcement.title || '',
        snippet: announcement.snippet || '',
        content: announcement.content || '',
        author: Array.isArray(announcement.author) ? announcement.author.join(', ') : (announcement.author || 'Platform Ops'),
        audience: announcement.audience || 'global',
        targetsInput: Array.isArray(announcement.targets) ? announcement.targets.join(', ') : '',
        channels: announcement.channels?.length ? announcement.channels : ['web'],
        status: announcement.status || 'draft',
        publishAt: toInputDateValue(announcement.publishAt || announcement.date),
        pinned: !!announcement.pinned,
      });
      setEditingAnnouncement(announcement);
    } else {
      resetComposer();
    }
    setComposerOpen(true);
  }, [resetComposer]);

  const handleAnnouncementUpdate = useCallback(async (announcement, updates) => {
    if (!announcement) return;
    try {
      const updated = await updateAnnouncement(announcement.id, updates);
      setAnnouncementsItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedAnnouncement((current) => (current?.id === updated.id ? updated : current));
    } catch (err) {
      setAnnouncementsError(err?.message || 'Unable to update announcement');
    }
  }, []);

  const handleStatusToggle = useCallback((announcement) => {
    if (!announcement) return;
    const nextStatus = announcement.status === 'published' ? 'draft' : 'published';
    const updates = { status: nextStatus };
    if (nextStatus === 'published') {
      updates.publishAt = new Date().toISOString();
    }
    handleAnnouncementUpdate(announcement, updates);
  }, [handleAnnouncementUpdate]);

  const handlePinToggle = useCallback((announcement) => {
    if (!announcement) return;
    handleAnnouncementUpdate(announcement, { pinned: !announcement.pinned });
  }, [handleAnnouncementUpdate]);

  const handlePublishNow = useCallback((announcement) => {
    if (!announcement) return;
    handleAnnouncementUpdate(announcement, { status: 'published', publishAt: new Date().toISOString() });
  }, [handleAnnouncementUpdate]);

  const handleDeleteAnnouncement = useCallback(async (announcement) => {
    if (!announcement) return;
    const confirmed = typeof window !== 'undefined'
      ? window.confirm(`Delete "${announcement.title}"? This cannot be undone.`)
      : true;
    if (!confirmed) return;
    try {
      await deleteAnnouncement(announcement.id);
      setAnnouncementsItems((prev) => prev.filter((item) => item.id !== announcement.id));
      setSelectedAnnouncement((current) => (current?.id === announcement.id ? null : current));
    } catch (err) {
      setAnnouncementsError(err?.message || 'Unable to delete announcement');
    }
  }, []);

  const handleContentChange = useCallback((content) => {
    setComposerValues((prev) => ({ ...prev, content }));
  }, []);

  const handleComposerSubmit = useCallback(async ({ onSuccess } = {}) => {
    setComposerSaving(true);
    const parsedTargets = composerValues.targetsInput
      ? composerValues.targetsInput.split(',').map((item) => item.trim()).filter(Boolean)
      : [];
    const payload = {
      title: composerValues.title,
      snippet: composerValues.snippet,
      content: composerValues.content,
      author: composerValues.author?.trim() || 'Platform Ops',
      audience: composerValues.audience,
      targets: parsedTargets,
      channels: composerValues.channels?.length ? composerValues.channels : ['web'],
      status: composerValues.status || 'draft',
      publishAt: fromInputDateValue(composerValues.publishAt) || undefined,
      pinned: composerValues.pinned,
    };
    try {
      let saved;
      if (editingAnnouncement) {
        saved = await updateAnnouncement(editingAnnouncement.id, payload);
        setAnnouncementsItems((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
      } else {
        saved = await createAnnouncement(payload);
        setAnnouncementsItems((prev) => [saved, ...prev]);
      }
      setSelectedAnnouncement(saved);
      if (typeof onSuccess === 'function') {
        onSuccess(saved);
      }
      setComposerOpen(false);
      resetComposer();
    } catch (err) {
      setAnnouncementsError(err?.message || 'Unable to save announcement');
    } finally {
      setComposerSaving(false);
    }
  }, [composerValues, editingAnnouncement, resetComposer]);

  const handleComposerClose = useCallback(() => {
    setComposerOpen(false);
    resetComposer();
  }, [resetComposer]);

  return {
    announcementsItems,
    announcementsLoading,
    announcementsError,
    announcementFilter,
    setAnnouncementFilter,
    announcementSearch,
    setAnnouncementSearch,
    selectedAnnouncement,
    setSelectedAnnouncement,
    composerOpen,
    composerSaving,
    composerValues,
    setComposerValues,
    sortedAnnouncements,
    announcementStats,
    fetchAnnouncements,
    openComposer,
    handleStatusToggle,
    handlePinToggle,
    handlePublishNow,
    handleDeleteAnnouncement,
    handleContentChange,
    handleComposerSubmit,
    handleComposerClose,
    resetComposer,
  };
}

