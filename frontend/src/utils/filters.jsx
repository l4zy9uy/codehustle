// Utility functions and constants for filtering problems

import React from 'react';
import { Group, Badge } from '@mantine/core';

// Returns color string for a given difficulty level
export const difficultyColor = (d) => {
  const k = String(d || '').toLowerCase();
  return { easy: 'green', medium: 'yellow', hard: 'red' }[k] || 'gray';
};

// Returns color string for a given verdict
export const verdictColor = (v) => {
  const k = String(v || '').toUpperCase();
  return { AC: 'green', WA: 'red', TLE: 'yellow', MLE: 'grape', RTE: 'orange', OLE: 'cyan', CE: 'gray' }[k] || 'gray';
};

// Clickable chip list (acts like radio group)
export const ChipList = ({ items, value, onChange }) => (
  <Group gap={8}>
    {items.map((it) => {
      const selected = value === it.value;
      return (
        <Badge
          key={it.value}
          color={it.color}
          variant={selected ? 'filled' : 'outline'}
          radius="xl"
          style={{
            cursor: 'pointer',
            // Use neutral/default border color for unselected state
            borderColor: selected
              ? undefined
              : 'var(--mantine-color-default-border, var(--mantine-color-gray-4))',
            textTransform: 'none',
          }}
          onClick={() => onChange(it.value)}
        >
          {it.label}
        </Badge>
      );
    })}
  </Group>
);

// Difficulty filter options
export const DIFFICULTY_OPTIONS = [
  { value: 'all', label: 'All', color: 'gray' },
  { value: 'easy', label: 'Easy', color: 'green' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'hard', label: 'Hard', color: 'red' },
];

// Status filter options
export const STATUS_OPTIONS = [
  { value: 'all', label: 'All', color: 'gray' },
  { value: 'solved', label: 'Solved', color: 'blue' },
  { value: 'unsolved', label: 'Unsolved', color: 'gray' },
]; 
