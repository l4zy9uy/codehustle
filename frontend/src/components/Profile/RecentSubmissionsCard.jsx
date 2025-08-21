import React from 'react';
import { Card, Group, Text, Divider, Stack, Badge } from '@mantine/core';

export default function RecentSubmissionsCard({ items = [] }) {
    return (
        <Card withBorder radius="lg" p="md">
            <Group justify="space-between" mb="xs">
                <Text fw={600}>Recent Submissions</Text>
            </Group>
            <Divider mb="sm" />
            <Stack gap="xs">
                {items.length === 0 && (
                    <Text c="dimmed" size="sm">
                        No recent submissions.
                    </Text>
                )}
                {items.slice(0, 12).map((s) => (
                    <Group key={s.id} justify="space-between" wrap="nowrap">
                        <Text size="sm" c="dimmed" style={{ minWidth: 112 }}>
                            {new Date(s.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <Text size="sm" lineClamp={1} style={{ flex: 1 }}>
                            {s.problemTitle}
                        </Text>
                        <Badge size="sm" variant="light">
                            {s.verdict}
                        </Badge>
                        {s.language && (
                            <Text size="xs" c="dimmed" style={{ minWidth: 60, textAlign: 'right' }}>
                                {s.language}
                            </Text>
                        )}
                    </Group>
                ))}
            </Stack>
        </Card>
    );
} 