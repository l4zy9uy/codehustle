import React from 'react';
import { Card, Text, Group, Divider, Anchor, Image } from '@mantine/core';
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
            <Card withBorder shadow="sm" p="lg" style={{ maxWidth: 800, width: '100%' }} mx="auto" mt="md">
                <Text size="xl" fw={600}>{title}</Text>
                <Group justify="space-between" mt="xs" mb="md">
                    <Text size="sm" c="dimmed">Posted on: {formattedDate}</Text>
                    <Text size="sm" c="dimmed">By: {author}</Text>
                </Group>
                <Divider />
                <Text mt="md">{content}</Text>
                {image && (
                    <Image src={image} alt={title} maw={800} radius="sm" mt="md" />
                )}
            </Card>
        </>
    );
} 
