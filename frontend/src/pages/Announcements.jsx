import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Text, Group, Select, Stack, Skeleton, Card, Button, Alert } from '@mantine/core';
import { IconBell, IconAlertCircle } from '@tabler/icons-react';
import AnnouncementCard from '../components/AnnouncementCard';
import AnnouncementDetail from '../components/AnnouncementDetail';
import { getAnnouncements, getAnnouncement, markAnnouncementRead } from '../lib/api/announcements';

const PAGE_SIZE = 5;

export default function AnnouncementsPage() {
    const navigate = useNavigate();
    const [sortOrder, setSortOrder] = useState('Newest');
    const [page, setPage] = useState(1);
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
      let cancelled = false;
      const fetchAnnouncements = async () => {
        setError(null);
        if (page === 1) setLoading(true);
        else setLoadingMore(true);
        try {
          const res = await getAnnouncements({ page, page_size: PAGE_SIZE });
          if (cancelled) return;
          const list = res?.items || [];
          setItems((prev) => {
            const next = page === 1 ? list : [...prev, ...list.filter((n) => !prev.some((p) => p.id === n.id))];
            setTotal(res?.total ?? next.length);
            return next;
          });
        } catch (err) {
          if (cancelled) return;
          setError(err?.message || 'Unable to load announcements');
          if (page > 1) {
            setPage((prev) => Math.max(1, prev - 1));
          } else {
            setItems([]);
            setTotal(0);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
            setLoadingMore(false);
          }
        }
      };
      fetchAnnouncements();
      return () => { cancelled = true; };
    }, [page]);

    const sortedAnnouncements = [...items].sort((a, b) =>
      sortOrder === 'Newest'
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date)
    );
    const currentAnnouncements = sortedAnnouncements;

    const totalItems = total;
    const start = totalItems === 0 ? 0 : 1;
    const end = items.length;
    const hasMore = items.length < total;

    const handleOpenAnnouncement = async (announcement) => {
      if (!announcement) return;
      navigate(`/announcements/${announcement.id}`);
      setItems((prev) => prev.map((item) => item.id === announcement.id ? { ...item, read: true } : item));
      try {
        await markAnnouncementRead(announcement.id, 'read');
      } catch {
        // ignore marking errors in UI
      }
    };

    const handleShowMore = () => {
      if (!hasMore || loadingMore) return;
      setPage((prev) => prev + 1);
    };

    const isInitialLoading = loading && !items.length;

    return (
        <Stack gap="md" p="md" style={{ maxWidth: 980, width: '100%', margin: '0 auto' }}>
            <Group justify="space-between" align="center">
                <Text size="xl" fw={600}>
                    Announcements
                </Text>
                <Select
                    placeholder="Sort by"
                    data={['Newest', 'Oldest']}
                    value={sortOrder}
                    onChange={(value) => {
                        setSortOrder(value);
                        setPage(1);
                    }}
                    w={140}
                />
            </Group>

            {error && (
              <Alert
                variant="light"
                color="red"
                icon={<IconAlertCircle size={16} />}
                mb="sm"
              >
                {error}
              </Alert>
            )}
            <Routes>
                <Route
                    index
                    element={
                        <>
                            {isInitialLoading ? (
                              Array.from({ length: 3 }).map((_, i) => (
                                <Card key={i} withBorder p="md" shadow="sm">
                                  <Group align="flex-start" gap="sm">
                                    <Skeleton height={60} width={60} radius="sm" />
                                    <Stack gap={6} style={{ flex: 1 }}>
                                      <Skeleton height={16} width="60%" />
                                      <Skeleton height={12} width="85%" />
                                      <Skeleton height={12} width="70%" />
                                    </Stack>
                                  </Group>
                                </Card>
                              ))
                            ) : currentAnnouncements.length > 0 ? (
                              <>
                                {currentAnnouncements.map((a) => (
                                  <AnnouncementCard
                                    key={a.id}
                                    announcement={a}
                                    onClick={() => handleOpenAnnouncement(a)}
                                  />
                                ))}
                                <Group justify="space-between" mt="md">
                                  <Text size="xs" c="dimmed">
                                    Showing {start}-{end} of {totalItems}
                                  </Text>
                                  <Button
                                    variant="light"
                                    size="xs"
                                    onClick={handleShowMore}
                                    disabled={!hasMore || loading || loadingMore}
                                  >
                                    {loadingMore ? 'Loading...' : hasMore ? 'Show more' : 'No more'}
                                  </Button>
                                </Group>
                              </>
                            ) : (
                              <Group align="center" justify="center" style={{ minHeight: 220 }}>
                                <Stack gap={8} align="center">
                                  <IconBell size={28} color="var(--mantine-color-gray-6)" />
                                  <Text size="sm" c="dimmed">No announcements to display.</Text>
                                </Stack>
                              </Group>
                            )}
                        </>
                    }
                />
                <Route path=":id" element={<AnnouncementDetailWrapper />} />
            </Routes>
        </Stack>
    );
}

function AnnouncementDetailWrapper() {
    const { id } = useParams();
    const [announcement, setAnnouncement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      if (!id) return;
      let cancelled = false;
      setLoading(true);
      setError(null);
      getAnnouncement(id)
        .then((res) => {
          if (!cancelled) {
            setAnnouncement(res || null);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err?.message || 'Unable to load announcement');
            setAnnouncement(null);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      markAnnouncementRead(id, 'read').catch(() => {});
      return () => { cancelled = true; };
    }, [id]);

    if (loading) return <Text size="sm" c="dimmed">Loading...</Text>;
    if (error || !announcement) return <Text size="sm" c="red">Announcement not available.</Text>;
    return <AnnouncementDetail announcement={announcement} />;
}
