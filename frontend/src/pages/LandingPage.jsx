// NavBar.jsx (full landing page)
import React from 'react';
import {
    AppShell,
    Container,
    Group,
    Anchor,
    Image,
    Button,
    Title,
    Text,
    Overlay,
    Box,
    SimpleGrid,
    Card,
    ThemeIcon,
} from '@mantine/core';
import { motion } from 'framer-motion';
import {
    IconUserPlus,
    IconKeyboard,
    IconTrophy,
    IconBinaryTree,
    IconGraph,
    IconBraces,
    IconUpload, IconBook2
} from '@tabler/icons-react';

import heroVideo from '../assets/hero-loop.mp4';     // adjust if needed
import whiteLogo from '../assets/white_logo.png';    // or ../assets/logo.svg if you prefer

const HEADER_H = 72;

const steps = [
    { title: 'Solve',  description: 'Pick a problem and implement your solution.', icon: (p) => <IconKeyboard {...p} /> },
    { title: 'Submit', description: 'Run all tests and view detailed results instantly.', icon: (p) => <IconUpload {...p} /> },
    { title: 'Learn',  description: 'Read explanations, compare solutions, and improve.', icon: (p) => <IconBook2 {...p} /> },
];

export default function LandingPage() {
    return (
        <>
            {/* Fixed video background (hero only) */}
            <Box
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 0,
                    pointerEvents: 'none',
                }}
            >
                <video
                    src={heroVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <Overlay
                    opacity={1}
                    gradient="linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,.65) 100%)"
                />
            </Box>

            {/* Content above video */}
            <AppShell
                header={{ height: HEADER_H }}
                padding={0}
                style={{ background: 'transparent', position: 'relative', zIndex: 1 }}
            >
                {/* Transparent header over video */}
                <AppShell.Header
                    style={{
                        background: 'transparent',
                        borderBottom: 'none',
                        backdropFilter: 'saturate(120%) blur(6px)',
                    }}
                >
                    <Container size="lg" style={{ height: '100%' }}>
                        <Group justify="space-between" align="center" style={{ height: '100%' }} wrap="nowrap">
                            <Anchor href="/" underline="never" aria-label="Go home">
                                <Image src={whiteLogo} alt="Logo" h={64} />
                            </Anchor>
                            <Button component="a" href="/login" variant="white" color="blue.9">
                                Log in
                            </Button>
                        </Group>
                    </Container>
                </AppShell.Header>

                <AppShell.Main style={{ position: 'relative', zIndex: 1, paddingTop: 0 }}>
                    {/* HERO (takes full viewport height minus header) */}
                    <Box
                        component="section"
                        style={{
                            minHeight: `calc(100vh - 0px)`, // fill full screen; header floats on top
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                        }}
                    >
                        <Container size="lg" style={{ textAlign: 'center' }}>
                            <Title order={1} style={{ color: 'white' }}>
                                CodeHUSTle: Ignite Your Coding Journey
                            </Title>
                            <Text size="lg" style={{ color: 'rgba(255,255,255,.9)', marginTop: 12 }}>
                                Explore problems, compete in challenges, and level up your skills.
                            </Text>
                            <Group justify="center" mt="lg" gap="md">
                                <Button
                                    size="md"
                                    radius="xl"
                                    variant="white"
                                    color="blue.9"
                                    component="a"
                                    href="/problems"
                                >
                                    Explore Problems
                                </Button>
                            </Group>
                        </Container>
                    </Box>

                    <Box aria-hidden="true" style={{ lineHeight: 0, width: '100%' }}>
                        <svg
                            viewBox="0 0 1440 120"
                            xmlns="http://www.w3.org/2000/svg"
                            preserveAspectRatio="none"
                            style={{ display: 'block', width: '100%', height: 120 }}
                        >
                            {/* top path matches the hero (transparent so the video shows), bottom fills white */}
                            <path d="M0,40 C240,100 480,0 720,60 C960,120 1200,40 1440,80 L1440,120 L0,120 Z" fill="#ffffff"/>
                        </svg>
                    </Box>

                    {/* Belief band – white, centered copy, still full-width */}
                    <Box bg="white" style={{ width: '100%' }}>
                        <Box style={{
                            padding: 'clamp(28px, 7vw, 72px)',
                            maxWidth: 880,               // narrower = more readable
                            margin: '0 auto',
                            textAlign: 'center'
                        }}>
                            <Title order={2} mb="xs">We believe anyone can code better—faster.</Title>
                            <Text size="lg" c="dimmed">
                                CodeHUSTle helps you practice with real tests, get instant feedback,
                                and learn curated patterns used in top interviews and contests.
                            </Text>
                        </Box>
                    </Box>

                    {/* ===== WHITE PAGE BELOW HERO ===== */}
                    <Box component="section" bg="white" style={{ width: '100%', zIndex: 2 }}>
                        <Box style={{ padding: 'clamp(24px, 6vw, 56px)', maxWidth: 1200, margin: '0 auto' }}>
                            {/* How it works */}
                            <Title order={2} mb="md">How it works</Title>
                            <Box style={{
                                height: 3,
                                width: 72,
                                borderRadius: 999,
                                background: 'linear-gradient(90deg, var(--mantine-color-blue-5), var(--mantine-color-cyan-5))',
                                marginBottom: '1.25rem'
                            }}/>
                            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={{ base: 'md', sm: 'lg' }}>
                                {steps.map((step, idx) => (
                                    <Card
                                        key={idx}
                                        component={motion.div}
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true, amount: 0.25 }}
                                        variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
                                        whileHover={{ y: -4, scale: 1.015 }}
                                        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                                        shadow="sm"
                                        padding="lg"
                                        radius="md"
                                        withBorder
                                    >
                                        <ThemeIcon size={40} radius="md" mb="sm" color={idx === 1 ? 'violet' : idx === 2 ? 'teal' : 'blue'}>
                                            {step.icon({ size: 24 })}
                                        </ThemeIcon>
                                        <Text fw={600} size="lg">{step.title}</Text>
                                        <Text size="sm" c="dimmed" mt="xs">{step.description}</Text>
                                    </Card>
                                ))}
                            </SimpleGrid>

                            {/* Problem Categories (unchanged) */}
                            {/* ... your existing Categories SimpleGrid ... */}
                        </Box>

                        {/* Footer (full-width background, centered content) */}
                        <Box
                            component={motion.footer}
                            mt="xl"
                            py="md"
                            bg="white"
                            style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1 }}
                        >
                            <Box style={{ maxWidth: 1200, margin: '0 auto', paddingInline: 'clamp(16px, 4vw, 24px)' }}>
                                <Text ta="center" size="sm">© {new Date().getFullYear()} CodeHUSTle</Text>
                            </Box>
                        </Box>
                    </Box>
                    {/* ===== END WHITE PAGE ===== */}
                </AppShell.Main>
            </AppShell>
        </>
    );
}
