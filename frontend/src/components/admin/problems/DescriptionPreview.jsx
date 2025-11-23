import React from 'react';
import { Paper, Title, Text, Stack, Divider } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { mdComponents, katexOptions } from '../../../utils/markdown.jsx';

export default function DescriptionPreview({ description }) {
  return (
    <Paper withBorder p="md">
      <Title order={4} mb="md">Preview</Title>
      <Divider mb="lg" />
      <Stack gap="lg">
        {description.legend && (
          <div>
            <ReactMarkdown 
              components={mdComponents} 
              remarkPlugins={[remarkGfm, remarkMath]} 
              rehypePlugins={[[rehypeKatex, katexOptions]]}
            >
              {description.legend}
            </ReactMarkdown>
          </div>
        )}
        
        {description.inputFormat && (
          <div>
            <Text fw={600} mb="xs">Input Format</Text>
            <ReactMarkdown 
              components={mdComponents} 
              remarkPlugins={[remarkGfm, remarkMath]} 
              rehypePlugins={[[rehypeKatex, katexOptions]]}
            >
              {description.inputFormat}
            </ReactMarkdown>
          </div>
        )}
        
        {description.outputFormat && (
          <div>
            <Text fw={600} mb="xs">Output Format</Text>
            <ReactMarkdown 
              components={mdComponents} 
              remarkPlugins={[remarkGfm, remarkMath]} 
              rehypePlugins={[[rehypeKatex, katexOptions]]}
            >
              {description.outputFormat}
            </ReactMarkdown>
          </div>
        )}
        
        {description.notes && (
          <div>
            <Text fw={600} mb="xs">Notes</Text>
            <ReactMarkdown 
              components={mdComponents} 
              remarkPlugins={[remarkGfm, remarkMath]} 
              rehypePlugins={[[rehypeKatex, katexOptions]]}
            >
              {description.notes}
            </ReactMarkdown>
          </div>
        )}
      </Stack>
    </Paper>
  );
}

