import React from 'react';
import { Card, Stack, Group, Text, Title, Divider, Badge } from '@mantine/core';

const DIFF_COLORS = {
    E: 'teal',
    M: 'orange',
    H: 'red',
};

export default function QuickStatsCard({ stats }) {
    return (
        <Card withBorder p="md" radius="lg">
            <Stack gap="xs">
                <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                        Total Solved
                    </Text>
                    <Title order={3}>{stats.total ?? 0}</Title>
                </Group>
                <Divider variant="dashed" />
                <Group justify="space-between">
                    <Text>Easy</Text>
                    <Badge color={DIFF_COLORS.E} variant="light">
                        {stats.easy ?? 0}
                    </Badge>
                </Group>
                <Group justify="space-between">
                    <Text>Medium</Text>
                    <Badge color={DIFF_COLORS.M} variant="light">
                        {stats.medium ?? 0}
                    </Badge>
                </Group>
                <Group justify="space-between">
                    <Text>Hard</Text>
                    <Badge color={DIFF_COLORS.H} variant="light">
                        {stats.hard ?? 0}
                    </Badge>
                </Group>
            </Stack>
        </Card>
    );
} 