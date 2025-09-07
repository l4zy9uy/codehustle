import React, { useEffect, useState } from 'react';
import { Container, Grid } from '@mantine/core';
import HeaderCard from '../components/Profile/HeaderCard';
import QuickStatsCard from '../components/Profile/QuickStatsCard';
import RecentSubmissionsCard from '../components/Profile/RecentSubmissionsCard';
import { getMyStats, getMyRecentSubmissions } from '../lib/api/users';
import { useAuth } from '../context/AuthContext';

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

export default function ProfilePage({ user: incomingUser, stats: incomingStats, recentSubmissions: incomingRecent = [] }) {
    const { user: ctxUser } = useAuth();
    const [user, setUser] = useState(incomingUser || ctxUser || {});
    const [stats, setStats] = useState(incomingStats || {});
    const [recentSubmissions, setRecentSubmissions] = useState(incomingRecent || []);

    useEffect(() => {
        // Update from auth context if provided
        if (!incomingUser && ctxUser) setUser(ctxUser);
    }, [incomingUser, ctxUser]);

    useEffect(() => {
        if (!incomingStats) {
            getMyStats().then(setStats).catch(() => setStats({ total: 0, easy: 0, medium: 0, hard: 0 }));
        }
        if (!incomingRecent || !incomingRecent.length) {
            getMyRecentSubmissions().then((res) => setRecentSubmissions(res.items || [])).catch(() => setRecentSubmissions([]));
        }
    }, [incomingStats, incomingRecent]);
    return (
        <Container size={1080} py="md">
            <HeaderCard user={user} />
            <Grid mt="md" gutter="lg">
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <RecentSubmissionsCard items={recentSubmissions} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <QuickStatsCard stats={stats} />
                </Grid.Col>
            </Grid>
        </Container>
    );
}
