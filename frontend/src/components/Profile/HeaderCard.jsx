import React from 'react';
import { Paper, Group, Avatar, Title, Text, Button } from '@mantine/core';

export default function HeaderCard({ user, onEdit }) {
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