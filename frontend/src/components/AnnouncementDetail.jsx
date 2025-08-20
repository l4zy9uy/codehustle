import React from 'react';
import { Card, Text, Group, Divider, Anchor } from '@mantine/core';
import { parseISO, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function AnnouncementDetail({ announcement }) {
    const navigate = useNavigate();
    if (!announcement) {
        return <Text size="sm" c="red">Announcement not found.</Text>;
    }

    const { title, date, author, content, image } = announcement;
    const formattedDate = format(parseISO(date), 'MMMM d, yyyy');

    return (
        <>
            <Anchor size="sm" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
                ← Back to Home
            </Anchor>
            <Card withBorder shadow="sm" p="lg" style={{ maxWidth: 800, width: '100%', margin: '1rem auto' }}>
                <Text size="xl" fw={600}>{title}</Text>
                <Group justify="space-between" mt="xs" mb="md">
                    <Text size="sm" c="dimmed">Posted on: {formattedDate}</Text>
                    <Text size="sm" c="dimmed">By: {author}</Text>
                </Group>
                <Divider />
                <Text mt="md">{content}</Text>
                {image && (
                    <img src={image} alt={title} style={{ width: '100%', maxWidth: 800, marginTop: '1rem', borderRadius: '4px' }} />
                )}
            </Card>
        </>
    );
} 