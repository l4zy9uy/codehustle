import React, { useState } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Text, Group, Select, Pagination, Stack } from '@mantine/core';
import AnnouncementCard from '../components/AnnouncementCard';
import AnnouncementDetail from '../components/AnnouncementDetail';
import announcements from '../data/announcements';

export default function AnnouncementsPage() {
    const navigate = useNavigate();
    const [sortOrder, setSortOrder] = useState('Newest');
    const [page, setPage] = useState(1);
    const itemsPerPage = 5;
    const sortedAnnouncements = [...announcements].sort((a, b) =>
      sortOrder === 'Newest'
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date)
    );
    const currentAnnouncements = sortedAnnouncements.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
        <Stack gap="md" p="md">
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
                            {currentAnnouncements.length > 0 ? (
                                currentAnnouncements.map((a) => (
                                    <AnnouncementCard
                                        key={a.id}
                                        announcement={a}
                                        onClick={() => navigate(`/announcements/${a.id}`)}
                                    />
                                ))
                            ) : (
                                <Text size="sm" c="dimmed">No announcements to display.</Text>
                            )}
                            <Group justify="center" mt="md">
                                {Math.ceil(announcements.length / itemsPerPage) > 1 && (
                                    <Pagination
                                        page={page}
                                        onChange={setPage}
                                        total={Math.ceil(announcements.length / itemsPerPage)}
                                        size="sm"
                                    />
                                )}
                            </Group>
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
    const announcement = announcements.find((a) => a.id === parseInt(id, 10));
    return <AnnouncementDetail announcement={announcement} />;
}
