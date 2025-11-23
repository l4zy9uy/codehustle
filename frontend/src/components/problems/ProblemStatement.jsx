import React from 'react';
import { Stack, Box, List } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { katexOptions } from '../../utils/markdown';

// Local markdown render components to normalize spacing without global CSS
const mdComponents = {
  p: (props) => <p style={{ margin: '0 0 6px 0' }} {...props} />,
  ul: (props) => <ul style={{ margin: '4px 0 6px', paddingLeft: '1.25rem' }} {...props} />,
  ol: (props) => <ol style={{ margin: '4px 0 6px', paddingLeft: '1.25rem' }} {...props} />,
  h1: (props) => <h1 style={{ margin: '8px 0 6px' }} {...props} />,
  h2: (props) => <h2 style={{ margin: '8px 0 6px' }} {...props} />,
  h3: (props) => <h3 style={{ margin: '6px 0 4px' }} {...props} />,
  h4: (props) => <h4 style={{ margin: '6px 0 4px' }} {...props} />,
  h5: (props) => <h5 style={{ margin: '6px 0 4px' }} {...props} />,
  h6: (props) => <h6 style={{ margin: '6px 0 4px' }} {...props} />,
  li: (props) => <li style={{ marginBottom: 4 }} {...props} />,
  code: ({ inline, className, children, ...props }) => {
    // For code blocks (not inline code), render as pre+code without math processing
    if (!inline && className) {
      // Convert children to string and ensure dollar signs are rendered literally
      const codeContent = typeof children === 'string' ? children : String(children);
      return (
        <pre style={{ margin: '8px 0', padding: '12px', background: 'var(--mantine-color-gray-0)', borderRadius: '8px', overflow: 'auto' }}>
          <code className={className} {...props}>
            {codeContent}
          </code>
        </pre>
      );
    }
    // For inline code, render normally
    return <code className={className} {...props}>{children}</code>;
  },
};

function Section({ id, title, children, hideTitle = false }) {
  return (
    <Stack id={id} gap="sm">
      {!hideTitle && <h3 style={{ margin: '8px 0 6px', fontSize: '1.25rem', fontWeight: 600 }}>{title}</h3>}
      <Box>{children}</Box>
    </Stack>
  );
}

export default function ProblemStatement({ problem }) {
  return (
    <>
      <Section id="overview" title="Description" hideTitle>
        <Box className="markdown" style={{ fontFamily: 'Inter, sans-serif' }}>
          <ReactMarkdown 
            components={mdComponents} 
            remarkPlugins={[remarkGfm, remarkMath]} 
            rehypePlugins={[[rehypeKatex, katexOptions]]}
          >
            {problem.statement?.overview || ''}
          </ReactMarkdown>
        </Box>
      </Section>

      {problem.statement?.input && (
        <Section id="input" title="Input">
          <Box className="markdown" style={{ fontFamily: 'Inter, sans-serif' }}>
            <ReactMarkdown components={mdComponents} remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, katexOptions]]}>
              {problem.statement.input}
            </ReactMarkdown>
          </Box>
        </Section>
      )}

      {problem.statement?.output && (
        <Section id="output" title="Output">
          <Box className="markdown" style={{ fontFamily: 'Inter, sans-serif' }}>
            <ReactMarkdown components={mdComponents} remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, katexOptions]]}>
              {problem.statement.output}
            </ReactMarkdown>
          </Box>
        </Section>
      )}

      {problem.statement?.constraints && problem.statement.constraints.length > 0 && (
        <Section id="constraints" title="Constraints">
          <List
            className="markdown"
            spacing={1}
            styles={{
              root: { marginTop: 4, marginBottom: 0, padding: 0 },
              item: { paddingTop: 0, paddingBottom: 0, marginBottom: 4 }
            }}
          >
            {Array.isArray(problem.statement?.constraints)
              ? problem.statement.constraints.map((c, i) => (
                  <List.Item key={i}>
                    <ReactMarkdown components={mdComponents} remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, katexOptions]]}>
                      {c}
                    </ReactMarkdown>
                  </List.Item>
                ))
              : String(problem.statement?.constraints)
                  .split(";")
                  .filter(Boolean)
                  .map((c, i) => (
                    <List.Item key={i}>
                      <ReactMarkdown components={mdComponents} remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, katexOptions]]}>
                        {c.trim()}
                      </ReactMarkdown>
                    </List.Item>
                  ))}
          </List>
        </Section>
      )}
    </>
  );
}

