import React from 'react';
import { Text, Title } from '@mantine/core';

// Configure KaTeX options for better math rendering
export const katexOptions = {
  throwOnError: false,
  errorColor: '#cc0000',
  displayMode: false,
  fleqn: false,
  macros: {
    "\\RR": "\\mathbb{R}",
    "\\NN": "\\mathbb{N}",
    "\\ZZ": "\\mathbb{Z}",
    "\\QQ": "\\mathbb{Q}",
    "\\CC": "\\mathbb{C}",
  },
};

// Markdown components for styling
export const mdComponents = {
  p: (props) => <Text style={{ marginBottom: '0.5rem' }} {...props} />,
  h1: (props) => <Title order={1} style={{ marginTop: '1rem', marginBottom: '0.5rem' }} {...props} />,
  h2: (props) => <Title order={2} style={{ marginTop: '1rem', marginBottom: '0.5rem' }} {...props} />,
  h3: (props) => <Title order={3} style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }} {...props} />,
  h4: (props) => <Title order={4} style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }} {...props} />,
};

