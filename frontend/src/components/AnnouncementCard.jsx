import React, { useState } from 'react';
import { Card, Text, Group, Image } from '@mantine/core';
import { parseISO, format } from 'date-fns';

export default function AnnouncementCard({ announcement, onClick }) {
    const { title, snippet, date, updatedAt, image } = announcement;
    const formattedDate = format(parseISO(date), 'MMM dd, yyyy');
    const formattedUpdatedAt = updatedAt ? format(parseISO(updatedAt), 'MMM dd, yyyy') : null;
    const [hovered, setHovered] = useState(false);

    return (
        <Card
            withBorder
            shadow={hovered ? 'md' : 'sm'}
            p="md"
            style={{ cursor: 'pointer', minHeight: 200, transition: 'box-shadow 120ms ease, transform 120ms ease' }}
            role="button"
            aria-label={`Open announcement: ${title}`}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <Group align="flex-start" gap="sm">
                {image && (
                    <Image src={image} alt={`${title} thumbnail`} width={60} height={60} radius="sm" fit="cover" />
                )}
                <div style={{ flex: 1 }}>
                    <Text fw={600} size="lg">
                        {title}
                    </Text>
                    <Text size="xs" c="dimmed" mt={4}>
                        Posted {formattedDate}
                        {formattedUpdatedAt && (
                            <> • Updated {formattedUpdatedAt}</>
                        )}
                    </Text>
                    <Text size="sm" c="dimmed" lineClamp={2} mt="xs">
                        {snippet}
                    </Text>
                </div>
            </Group>
        </Card>
    );
} 
