import React from 'react';
import {
    Avatar,
    Badge,
    Card,
    Container,
    Divider,
    Grid,
    Group,
    Paper,
    Text,
    Title,
    Stack
} from '@mantine/core';

/**
 * CodeHustle – Profile Page (Desktop-first)
 *
 * Scope aligned with project constraints:
 * - No country/location
 * - No "member since"
 * - No course progress
 * - No external profile links
 *
 * Props contract (UI only; no network here):
 *   user: {
 *     handle: string,
 *     displayName?: string,
 *     avatarUrl?: string,
 *   }
 *   stats: {
 *     total: number,
 *     easy: number,
 *     medium: number,
 *     hard: number,
 *   }
 *   solved: Array<{
 *     id: string | number,
 *     title: string,
 *     difficulty: 'E' | 'M' | 'H',
 *     tags: string[],
 *     solvedAt: string, // ISO date
 *   }>
 *   attempted: Array<{
 *     id: string | number,
 *     title: string,
 *     difficulty: 'E' | 'M' | 'H',
 *     lastVerdict: string, // e.g., AC/WA/TLE/RE/CE
 *     language: string,
 *     lastSubmittedAt: string, // ISO date
 *   }>
 *   recentSubmissions: Array<{
 *     id: string | number,
 *     problemTitle: string,
 *     verdict: string,
 *     language?: string,
 *     submittedAt: string, // ISO date
 *   }>
 *
 * Usage:
 *   <ProfilePage
 *      user={{ handle: 'raumania', displayName: 'Raumania', avatarUrl: '...' }}
 *      stats={{ total: 123, easy: 77, medium: 35, hard: 11 }}
 *      solved={[...]}
 *      attempted={[...]}
 *      recentSubmissions={[...]}
 *   />
 */

const DIFF_COLORS = {
    E: 'teal',
    M: 'orange',
    H: 'red',
};

const PAGE_SIZE = 20;

function DifficultyBadge({ d }) {
    const label = d === 'E' ? 'Easy' : d === 'M' ? 'Medium' : 'Hard';
    return (
        <Badge variant="light" color={DIFF_COLORS[d]} radius="sm">
            {label}
        </Badge>
    );
}

function QuickStatsCard({ stats }) {
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

function RecentSubmissionsCard({ items = [] }) {
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

function HeaderCard({ user, onEdit }) {
    return (
        <Paper withBorder p="md" radius="lg">
            <Group align="center" justify="space-between" wrap="nowrap">
                <Group align="center" wrap="nowrap">
                    <Avatar src={user?.avatarUrl} size={80} radius="md">
                        {user?.handle?.[0]?.toUpperCase()}
                    </Avatar>
                    <div>
                        <Group gap={6}>
                            <Title order={3} style={{ lineHeight: 1.2 }}>
                                {user?.handle}
                            </Title>
                            {user?.displayName && (
                                <Text c="dimmed" size="sm">
                                    · {user.displayName}
                                </Text>
                            )}
                        </Group>
                    </div>
                </Group>
                {onEdit && (
                    <Button variant="light" onClick={onEdit} radius="md">
                        Edit
                    </Button>
                )}
            </Group>
        </Paper>
    );
}

export default function ProfilePage({ user, stats, recentSubmissions = [] }) {
    return (
        <Container size={1080} py="md">
            {/* Header */}
            <HeaderCard user={user} />

            <Grid mt="md" gutter="lg">
                {/* MAIN - only recent submissions */}
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <RecentSubmissionsCard items={recentSubmissions} />
                </Grid.Col>

                {/* SIDEBAR - stats */}
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <QuickStatsCard stats={stats} />
                </Grid.Col>
            </Grid>
        </Container>
    );
}
