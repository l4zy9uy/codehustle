import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Text, Group, Select, Pagination, Stack, Skeleton, Card } from '@mantine/core';
import AnnouncementCard from '../components/AnnouncementCard';
import AnnouncementDetail from '../components/AnnouncementDetail';
import { getAnnouncements, getAnnouncement, markAnnouncementRead } from '../lib/api/announcements';
import announcementsData from '../data/announcements';

export default function Home() {
    const navigate = useNavigate();
    const [sortOrder, setSortOrder] = useState('Newest');
    const [page, setPage] = useState(1);
    const defaultPageSize = 5;
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [fallbackItems, setFallbackItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      let cancelled = false;
      const fetchAnnouncements = async () => {
        setLoading(true);
        try {
          const res = await getAnnouncements({ page, page_size: pageSize });
          if (cancelled) return;
          const list = res?.items || [];
          setItems(list);
          setTotal(res?.total ?? list.length);
          setPageSize(res?.page_size ?? pageSize);
          setFallbackItems([]);
        } catch {
          if (cancelled) return;
          const sortedFallback = [...announcementsData].sort((a, b) => new Date(b.date) - new Date(a.date));
          setFallbackItems(sortedFallback);
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      fetchAnnouncements();
      return () => {
        cancelled = true;
      };
    }, [page, pageSize]);

    const sortedAnnouncements = [...(fallbackItems.length ? fallbackItems : items)].sort((a, b) =>
      sortOrder === 'Newest'
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date)
    );
    const pagedAnnouncements = fallbackItems.length
      ? sortedAnnouncements.slice((page - 1) * pageSize, page * pageSize)
      : sortedAnnouncements;

    const totalItems = fallbackItems.length ? fallbackItems.length : total;
    const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalItems);

    const handleOpenAnnouncement = async (announcement) => {
      if (!announcement) return;
      navigate(`/home/${announcement.id}`);
      setItems((prev) => prev.map((item) => item.id === announcement.id ? { ...item, read: true } : item));
      setFallbackItems((prev) => prev.map((item) => item.id === announcement.id ? { ...item, read: true } : item));
      try {
        await markAnnouncementRead(announcement.id, 'read');
      } catch {
        // ignore marking errors in UI
      }
    };

    return (
        <Stack gap="md" p="md" style={{ maxWidth: 1440, width: '100%', margin: '0 auto' }}>
            <Group justify="space-between" align="center">
                <Text size='huge' fw={600}>
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
            <Routes>
                <Route
                    index
                    element={
                        <>
                            {loading ? (
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
                            ) : pagedAnnouncements.length > 0 ? (
                              <>
                                {pagedAnnouncements.map((a) => (
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
                                  {Math.ceil(totalItems / pageSize) > 1 && (
                                    <Pagination
                                      page={page}
                                      onChange={setPage}
                                      total={Math.ceil(totalItems / pageSize)}
                                      size="sm"
                                    />
                                  )}
                                </Group>
                              </>
                            ) : (
                              <Group align="center" justify="center" style={{ minHeight: 200 }}>
                                <Text size="sm" c="dimmed">No announcements to display.</Text>
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
    useEffect(() => {
      if (!id) return;
      const fallback = announcementsData.find((item) => String(item.id) === String(id)) || null;
      getAnnouncement(id)
        .then((res) => {
          if (res && Object.keys(res).length) {
            setAnnouncement(res);
          } else {
            setAnnouncement(fallback);
          }
        })
        .catch(() => setAnnouncement(fallback));
      markAnnouncementRead(id, 'read').catch(() => {});
    }, [id]);
    if (!announcement) return <Text size="sm" c="dimmed">Loading...</Text>;
    return <AnnouncementDetail announcement={announcement} />;
}
