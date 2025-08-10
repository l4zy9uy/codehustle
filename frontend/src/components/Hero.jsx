import React from 'react';
import { Box, Container, Title, Text, Button } from '@mantine/core';
import { motion } from 'framer-motion';
import VideoBg from '../assets/hero-loop.mp4'; // 720p, <3s

const headline = {
    hidden: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
    visible: { opacity: 1, clipPath: 'inset(0 0 0 0)' },
};

export function Hero() {
    return (
        <Box
            component="section"
            sx={{ position: 'relative', height: '100vh', overflow: 'hidden' }}
        >
            {/* Background video */}
            <video
                autoPlay
                muted
                loop
                style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '100%', height: '100%', objectFit: 'cover',
                    zIndex: -2,
                }}
                src={VideoBg}
            />
            {/* Gradient overlay */}
            <Box
                sx={{
                    position: 'absolute', top: 0, left: 0,
                    width: '100%', height: '100%',
                    background:
                        'linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.6))',
                    zIndex: -1,
                }}
            />
            <Container
                size="lg"
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    textAlign: 'center',
                    color: 'white',
                }}
            >
                {/* Floating Icons Layer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                >
                    {/* map over an array of icon SVGs with slow drift animations */}
                </motion.div>

                {/* Typewriter Headline */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={headline}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                >
                    <Title order={1} size="h1">
                        CodeHUSTle: Ignite Your Coding Journey
                    </Title>
                </motion.div>

                {/* Subheading */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                >
                    <Text size="lg" mt="md">
                        Explore problems, compete instantly, and level up your skills.
                    </Text>
                </motion.div>

                {/* CTA Button */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.8, type: 'spring', stiffness: 300 }}
                >
                    <Button
                        component={motion.a}
                        href="/problems"
                        size="xl"
                        radius="xl"
                        mt="xl"
                        whileHover={{ scale: 1.05 }}
                    >
                        Explore Problems
                    </Button>
                </motion.div>
            </Container>
        </Box>
    );
}
