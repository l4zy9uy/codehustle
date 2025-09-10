import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Text, Group, Select, Pagination, Stack, Skeleton, Card } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import AnnouncementCard from '../components/AnnouncementCard';
import AnnouncementDetail from '../components/AnnouncementDetail';
import { getAnnouncements, getAnnouncement } from '../lib/api/announcements';

export default function AnnouncementsPage() {
    const navigate = useNavigate();
    const [sortOrder, setSortOrder] = useState('Newest');
    const [page, setPage] = useState(1);
    const itemsPerPage = 5;
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      setLoading(true);
      getAnnouncements()
        .then((res) => setItems(res.items || []))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }, []);

    const sortedAnnouncements = [...items].sort((a, b) =>
      sortOrder === 'Newest'
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date)
    );
    const currentAnnouncements = sortedAnnouncements.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const totalItems = items.length;
    const start = totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1;
    const end = Math.min(page * itemsPerPage, totalItems);

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
                            ) : currentAnnouncements.length > 0 ? (
                              <>
                                {currentAnnouncements.map((a) => (
                                  <AnnouncementCard
                                    key={a.id}
                                    announcement={a}
                                    onClick={() => navigate(`/announcements/${a.id}`)}
                                  />
                                ))}
                                <Group justify="space-between" mt="md">
                                  <Text size="xs" c="dimmed">
                                    Showing {start}-{end} of {totalItems}
                                  </Text>
                                  {Math.ceil(items.length / itemsPerPage) > 1 && (
                                    <Pagination
                                      page={page}
                                      onChange={setPage}
                                      total={Math.ceil(items.length / itemsPerPage)}
                                      size="sm"
                                    />
                                  )}
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
    useEffect(() => {
      if (!id) return;
      getAnnouncement(id).then(setAnnouncement).catch(() => setAnnouncement(null));
    }, [id]);
    if (!announcement) return <Text size="sm" c="dimmed">Loading...</Text>;
    return <AnnouncementDetail announcement={announcement} />;
}
