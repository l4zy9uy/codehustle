import React from 'react';
import { Badge } from '@mantine/core';

const DIFF_COLORS = {
    E: 'teal',
    M: 'orange',
    H: 'red',
};

export default function DifficultyBadge({ difficulty }) {
    const label = difficulty === 'E' ? 'Easy' : difficulty === 'M' ? 'Medium' : 'Hard';
    return (
        <Badge variant="light" color={DIFF_COLORS[difficulty]} radius="sm">
            {label}
        </Badge>
    );
} 