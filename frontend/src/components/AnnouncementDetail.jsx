import React from 'react';
import { Text, Group, Anchor, Image, Box, Stack } from '@mantine/core';
import { parseISO, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

// Markdown render components matching DMOJ style
const mdComponents = {
    p: ({ node, ...props }) => <p style={{ margin: '0 0 12px 0', lineHeight: '1.6' }} {...props} />,
    ul: ({ node, ...props }) => <ul style={{ margin: '8px 0 12px', paddingLeft: '1.5rem' }} {...props} />,
    ol: ({ node, ...props }) => <ol style={{ margin: '8px 0 12px', paddingLeft: '1.5rem' }} {...props} />,
    h1: ({ node, ...props }) => <h1 style={{ margin: '16px 0 8px', fontSize: '1.8em', fontWeight: 600 }} {...props} />,
    h2: ({ node, ...props }) => <h2 style={{ margin: '16px 0 8px', fontSize: '1.5em', fontWeight: 600 }} {...props} />,
    h3: ({ node, ...props }) => <h3 style={{ margin: '12px 0 6px', fontSize: '1.25em', fontWeight: 600 }} {...props} />,
    h4: ({ node, ...props }) => <h4 style={{ margin: '12px 0 6px', fontSize: '1.1em', fontWeight: 600 }} {...props} />,
    li: ({ node, ...props }) => <li style={{ marginBottom: '4px' }} {...props} />,
    a: ({ node, ...props }) => <a style={{ color: 'var(--mantine-color-blue-6)', textDecoration: 'none' }} {...props} />,
    code: ({ node, inline, className, children, ...props }) => {
        if (!inline && className) {
            const codeContent = typeof children === 'string' ? children : String(children);
            return (
                <pre style={{ margin: '12px 0', padding: '12px', background: 'var(--mantine-color-gray-0)', borderRadius: '8px', overflow: 'auto' }}>
                    <code className={className} {...props}>
                        {codeContent}
                    </code>
                </pre>
            );
        }
        return <code style={{ background: 'var(--mantine-color-gray-1)', padding: '2px 4px', borderRadius: '4px', fontSize: '0.9em' }} {...props}>{children}</code>;
    },
    blockquote: ({ node, ...props }) => (
        <blockquote style={{ margin: '12px 0', paddingLeft: '16px', borderLeft: '4px solid var(--mantine-color-gray-4)', color: 'var(--mantine-color-gray-7)' }} {...props} />
    ),
};

// Format date to match DMOJ format: "Aug. 2, 2025, 1:06 p.m."
function formatDMojDate(dateString) {
    try {
        const date = parseISO(dateString);
        // Format: "MMM. d, yyyy, h:mm a" -> "Aug. 2, 2025, 1:06 PM"
        // Then convert "AM"/"PM" to "a.m."/"p.m." to match DMOJ format
        const formatted = format(date, 'MMM. d, yyyy, h:mm a');
        return formatted.replace(/\s(AM|PM)$/i, (match, period) => {
            return period.toLowerCase() === 'am' ? ' a.m.' : ' p.m.';
        });
    } catch (e) {
        return dateString;
    }
}

export default function AnnouncementDetail({ announcement }) {
    const navigate = useNavigate();
    if (!announcement) {
        return <Text size="sm" c="red">Announcement not found.</Text>;
    }

    const { title, date, author, content, image, updatedAt } = announcement;
    
    // Handle author(s) - can be string or array
    const authors = Array.isArray(author) ? author.join(', ') : author;
    const formattedDate = formatDMojDate(date);
    const formattedUpdatedAt = updatedAt ? formatDMojDate(updatedAt) : null;

    return (
        <Stack gap="md" style={{ maxWidth: 1440, width: '100%', margin: '0 auto' }} p="md">
            <Anchor size="sm" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
                ← Back to Home
            </Anchor>
            
            {/* Main article matching DMOJ structure */}
            <article style={{ width: '100%' }}>
                {/* Title as h2 matching DMOJ */}
                <h2 style={{ margin: '0 0 16px 0', fontSize: '1.75em', fontWeight: 600 }}>
                    {title}
                </h2>
                
                {/* Horizontal rule matching DMOJ */}
                <hr style={{ margin: '0 0 16px 0', border: 'none', borderTop: '1px solid var(--mantine-color-gray-3)' }} />
                
                {/* Author and date metadata matching DMOJ format */}
                <Text size="sm" c="dimmed" mb="md">
                    {authors} posted on {formattedDate}
                    {formattedUpdatedAt && ` • Last updated on ${formattedUpdatedAt}`}
                </Text>
                
                {/* Content body with markdown rendering */}
                <Box className="markdown-content" style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
                    {image && (
                        <Image src={image} alt={title} maw={980} radius="sm" mb="md" />
                    )}
                    <ReactMarkdown
                        components={mdComponents}
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex, rehypeRaw]}
                        skipHtml={false}
                    >
                        {content || ''}
                    </ReactMarkdown>
                </Box>
            </article>
            
            {/* Comments section matching DMOJ structure */}
        </Stack>
    );
} 
