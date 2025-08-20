import React from 'react';
import { Card, Text, Group, Image } from '@mantine/core';
import { parseISO, format } from 'date-fns';

export default function AnnouncementCard({ announcement, onClick }) {
    const { title, snippet, date, image } = announcement;
    const formattedDate = format(parseISO(date), 'MMM dd, yyyy');

    return (
        <Card
            withBorder
            shadow="sm"
            p="md"
            style={{ cursor: 'pointer', minHeight: 200 }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
            onClick={onClick}
        >
            <Group justify="space-between" align="center">
                <Group align="flex-start" spacing="sm">
                    {image && (
                        <Image src={image} alt={`${title} thumbnail`} width={60} height={60} radius="sm" fit="cover" />
                    )}
                    <div>
                        <Text fw={600} size="lg">
                            {title}
                        </Text>
                        <Text size="sm" c="dimmed" lineClamp={3}>
                            {snippet}
                        </Text>
                    </div>
                </Group>
                <Text size="sm" c="dimmed">
                    {formattedDate}
                </Text>
            </Group>
        </Card>
    );
} 