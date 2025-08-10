// components/AuthLayout.jsx
import React from 'react';
import { Flex, Box, Image } from '@mantine/core';
import authBackground from '../assets/auth-background.jpg';

export default function AuthLayout({ children }) {
    return (
        // Full viewport height flex container
        <Flex
            h="100vh"
            w="100%"
            mih="100vh"
            // debug layout
            // bg='gray.3'
        >
            {/* Left: 7 parts flex for background image */}
            <Flex
                flex={8}
                p={0}
            >
                <Image
                    src={authBackground}
                    alt="Auth background"
                    fit="cover"
                    h="100%"
                    w="100%"
                />
            </Flex>

            {/* Right: 5 parts flex for centered form */}
            <Flex
                direction="column"
                align="center"
                justify="center"
                flex={4}
                h="100%"          // ensure child spans full parent height
                bg="red.1"        // debug background
                p="md"
            >
                <Box>
                    {children}
                </Box>
            </Flex>
        </Flex>
    );
}
