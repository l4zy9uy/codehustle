import React, { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from 'react-router-dom';
import { getProblem, submitProblem } from '../lib/api/problems';
import { listSubmissions, getSubmission } from '../lib/api/submissions';
import {
    Badge,
    Box,
    Button,
    ActionIcon,
    Collapse,
    Divider,
    Group,
    List,
    Paper,
    ScrollArea,
    Select,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
    Tooltip,
    Skeleton,
    Loader,
    Table,
} from "@mantine/core";
import {
    IconCpu,
    IconInfoCircle,
    IconSend,
    IconTag,
    IconChecks,
    IconClock,
    IconChevronDown,
    IconChevronUp,
    IconFileText,
    IconCode,
    IconListCheck,
    IconCopy,
} from "@tabler/icons-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// Configure KaTeX options for better math rendering
const katexOptions = {
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
import CopyPre from "../components/CopyPre";
// Externalized submission components/hooks
import SubmissionRowExt from "../components/ProblemDetail/SubmissionRow";
import SubmissionDetailExt from "../components/ProblemDetail/SubmissionDetail";
import useSubmissionExpansionExt from "../components/ProblemDetail/useSubmissionExpansion";
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { python } from '@codemirror/lang-python';
// removed custom basicSetup import; using wrapper basicSetup prop instead

/**
 * ProblemPage.jsx — Desktop-first problem detail page for CodeHustle OJ
 * Product rules (as agreed):
 *  - Only Submit (NO run-on-sample)
 *  - No Notes / No Editorial sections
 *  - Samples are rendered INLINE (no file downloads)
 *  - Tags = categories
 *  - Difficulty pill colors: easy=green, medium=yellow, hard=red
 *  - "Solved" badge next to title if solved
 *  - All problem metadata (title, difficulty, solved, id, memory, tags, optional acceptance) lives in LEFT column
 */

const DIFF_COLOR = {
    easy: "green",
    medium: "yellow",
    hard: "red",
};

const PANE_HEADER_H = 24;
const LANG_LABEL_VALUE = '__lang_label__';

// Shared styles
const headerButtonStyle = (active) => ({
    fontWeight: active ? 600 : 200,
    height: PANE_HEADER_H,
    paddingInline: 8,
    fontSize: 'var(--mantine-font-size-sm)',
    lineHeight: 1,
    borderBottom: 0,
    borderRadius: 4,
    color: active ? 'var(--mantine-color-gray-9)' : 'var(--mantine-color-dimmed)',
});

const CODE_BOX_STYLE = {
    fontFamily: 'var(--mantine-font-family-monospace)',
    fontSize: 'var(--mantine-font-size-sm)',
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    overflowX: "hidden",
    overflowY: "auto",
    maxHeight: 320,
    padding: 12,
    border: "1px solid var(--mantine-color-gray-3)",
    borderRadius: 8,
    background: "var(--mantine-color-gray-0)",
};

// Shared constants for submission detail/diffs
const MAX_CODE_H = 240;
const CODE_PREVIEW_BOX = {
    border: '1px solid var(--mantine-color-default-border)',
    borderRadius: 8,
    maxHeight: MAX_CODE_H,
    overflow: 'auto',
    fontFamily: 'var(--mantine-font-family-monospace)',
    fontSize: 'var(--mantine-font-size-sm)',
    padding: 8,
    background: 'var(--mantine-color-gray-0)'
};
const CODE_BLOCK_BOX = {
    border: '1px solid var(--mantine-color-default-border)',
    borderRadius: 8,
    padding: 8,
    background: 'var(--mantine-color-gray-0)'
};
const DIFF_HL_LEFT = 'rgba(255, 59, 48, 0.12)';
const DIFF_HL_RIGHT = 'rgba(46, 160, 67, 0.12)';

function PaneHeader({ children }) {
    return (
        <Group
            gap={4}
            wrap="nowrap"
            align="center"
            style={{ height: PANE_HEADER_H, borderBottom: 0, marginTop: 0}}
        >
            {children}
        </Group>
    );
}

// Minimal extraction: TabButton for header buttons
function TabButton({ active, onClick, leftSection, children }) {
    return (
        <Button
            variant="subtle"
            size="xs"
            color="gray"
            radius="xs"
            styles={{
                label: {
                    fontWeight: active ? 600 : 200,
                    color: active ? 'var(--mantine-color-gray-9)' : 'var(--mantine-color-dimmed)'
                }
            }}
            style={headerButtonStyle(active)}
            onClick={onClick}
            leftSection={leftSection}
        >
            {children}
        </Button>
    );
}

// Minimal extraction: Header bar wrapper with gray background and 4px padding
function PaneHeaderBar({ children }) {
    return (
        <Box style={{ padding: 4, background: 'var(--mantine-color-gray-0)' }}>
            {children}
        </Box>
    );
}

function LeftTabsHeader({ leftTab, setLeftTab }) {
    return (
        <PaneHeader>
            <TabButton
                active={leftTab === 'problem'}
                onClick={() => setLeftTab('problem')}
                leftSection={<IconFileText size={16} />}
            >
                Problem
            </TabButton>
            <Divider orientation="vertical" style={{ height: 18, alignSelf: 'center' }} />
            <TabButton
                active={leftTab === 'submissions'}
                onClick={() => setLeftTab('submissions')}
                leftSection={<IconListCheck size={16} />}
            >
                Submissions
            </TabButton>
        </PaneHeader>
    );
}

function DifficultyBadge({ level }) {
    const key = (level || "").toLowerCase();
    const color = DIFF_COLOR[key] || "gray";
    const label = key ? key[0].toUpperCase() + key.slice(1) : "Unknown";
    const textColorVar = `var(--mantine-color-${color}-6)`;
    return (
        <Badge size="md" variant="light" color="gray" radius="xl" style={{ color: textColorVar }}>
            {label}
        </Badge>
    );
}

function MetaRow({ icon, label, value, tooltip }) {
    if (value === undefined || value === null || value === "") return null;
    return (
        <Tooltip label={tooltip} openDelay={300}>
            <Group gap={6} wrap="nowrap">
                <ThemeIcon size={22} radius="md" variant="light">
                    {icon}
                </ThemeIcon>
                <Text size="sm" c="dimmed">{label}:</Text>
                <Text size="sm" fw={600}>{value}</Text>
            </Group>
        </Tooltip>
    );
}

function TagList({ tags = [] }) {
    if (!tags.length) return null;
    return (
        <Group gap={8} wrap="wrap">
            {tags.map((t) => (
                <Badge key={t} variant="light" radius="xl" leftSection={<IconTag size={14} />}>{t}</Badge>
            ))}
        </Group>
    );
}

// Status-specific small components
function StatusAC() {
    return <Text size="sm" c="teal">Accepted</Text>;
}
function StatusTLE() {
    return <Text size="sm" c="dimmed">Time Limit Exceeded</Text>;
}
function StatusPending() {
    return (
        <Group gap={8} align="center">
            <Loader size="xs" />
            <Text size="sm" c="dimmed">Judging…</Text>
        </Group>
    );
}
function StatusCE({ s, showMoreMap, setShowMoreMap, truncate }) {
    return (
        <Stack gap={6}>
            <Text size="sm" fw={600}>Compiler output</Text>
            <Box style={CODE_BLOCK_BOX}>
                <CopyPre text={truncate(String(s.compileLog || ''), showMoreMap[s.id + '_ce'] ? 4000 : 500)} style={{ margin: 0 }} showCopy={false} />
            </Box>
            <Group justify="flex-end">
                <Button size="xs" variant="subtle" color="gray" onClick={() => setShowMoreMap((m) => ({ ...m, [s.id + '_ce']: !m[s.id + '_ce'] }))}>{showMoreMap[s.id + '_ce'] ? 'Show less' : 'Show more'}</Button>
            </Group>
        </Stack>
    );
}
function StatusRTE({ s, showMoreMap, setShowMoreMap, truncate }) {
    return (
        <Stack gap={6}>
            <Text size="sm" fw={600}>Runtime error</Text>
            <Box style={CODE_BLOCK_BOX}>
                <CopyPre text={truncate(String(s.runtimeError || ''), showMoreMap[s.id + '_re'] ? 4000 : 500)} style={{ margin: 0 }} showCopy={false} />
            </Box>
            <Group justify="flex-end">
                <Button size="xs" variant="subtle" color="gray" onClick={() => setShowMoreMap((m) => ({ ...m, [s.id + '_re']: !m[s.id + '_re'] }))}>{showMoreMap[s.id + '_re'] ? 'Show less' : 'Show more'}</Button>
            </Group>
        </Stack>
    );
}

// DiffCase: side-by-side failed case renderer with truncation and input collapse
function DiffCase({ fc, showMoreMap, setShowMoreMap, openInputMap, setOpenInputMap, truncate }) {
    const showAll = !!showMoreMap[fc.id];
    const yourText = showAll ? fc.your : truncate(fc.your, 256);
    const expectedText = showAll ? fc.expected : truncate(fc.expected, 256);
    const inputOpen = !!openInputMap[fc.id];
    return (
        <Stack key={fc.id} gap={6}>
            <Group justify="space-between" align="center">
                <Text size="sm" c="dimmed">{fc.summary}</Text>
                <Button size="xs" variant="subtle" color="gray" leftSection={inputOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />} onClick={() => setOpenInputMap((m) => ({ ...m, [fc.id]: !m[fc.id] }))}>Input</Button>
            </Group>
            <Collapse in={inputOpen}>
                <Box style={CODE_BLOCK_BOX}>
                    <CopyPre text={fc.input} style={{ margin: 0 }} showCopy={true} />
                </Box>
            </Collapse>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                <Stack gap={4}>
                    <Text size="xs" c="dimmed">Your Output</Text>
                    <Box style={CODE_BLOCK_BOX}>
                        {yourText.split('\n').map((line, idx) => (
                            <div key={idx} style={{ background: (fc.diffLines?.left || []).includes(idx) ? DIFF_HL_LEFT : 'transparent', fontFamily: 'var(--mantine-font-family-monospace)' }}>{line}</div>
                        ))}
                    </Box>
                </Stack>
                <Stack gap={4}>
                    <Text size="xs" c="dimmed">Expected Output</Text>
                    <Box style={CODE_BLOCK_BOX}>
                        {expectedText.split('\n').map((line, idx) => (
                            <div key={idx} style={{ background: (fc.diffLines?.right || []).includes(idx) ? DIFF_HL_RIGHT : 'transparent', fontFamily: 'var(--mantine-font-family-monospace)' }}>{line}</div>
                        ))}
                    </Box>
                </Stack>
            </SimpleGrid>
            <Group justify="flex-end">
                <Button size="xs" variant="subtle" color="gray" onClick={() => setShowMoreMap((m) => ({ ...m, [fc.id]: !m[fc.id] }))}>{showAll ? 'Show less' : 'Show more'}</Button>
            </Group>
        </Stack>
    );
}

function StatusWA({ s, showMoreMap, setShowMoreMap, openInputMap, setOpenInputMap, truncate }) {
    const cases = (s.failedCases && s.failedCases.length ? s.failedCases : [
        { id: 'mock1', summary: 'Mismatch at line 3', input: '3\n1 2 3', your: '6\n1 2', expected: '6\n1 2 3', diffLines: { left: [1], right: [1] } },
    ]);
    return (
        <Stack gap={8}>
            <Text size="sm" fw={600}>Failed cases</Text>
            {cases.map((fc) => (
                <DiffCase
                    key={fc.id}
                    fc={fc}
                    showMoreMap={showMoreMap}
                    setShowMoreMap={setShowMoreMap}
                    openInputMap={openInputMap}
                    setOpenInputMap={setOpenInputMap}
                    truncate={truncate}
                />
            ))}
        </Stack>
    );
}

// Helper components for submission list
function SubmissionRow({ submission, onClick, children }) {
    return (
        <Stack key={submission.id} gap={6}>
            <Group
                justify="space-between"
                wrap="nowrap"
                onClick={onClick}
                style={{
                    background: 'var(--mantine-color-gray-0)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    cursor: 'pointer',
                }}
            >
                <Group gap={8} wrap="nowrap">
                    <Badge variant="light" color="gray" radius="sm">{submission.status}</Badge>
                    <Text size="sm" c="dimmed">{submission.lang}</Text>
                </Group>
                <Text size="sm" c="dimmed">{submission.when}</Text>
            </Group>
            {children}
        </Stack>
    );
}

function SubmissionDetail({ s, loading, showMoreMap, setShowMoreMap, openInputMap, setOpenInputMap, truncate }) {
    return (
        <Paper withBorder radius="md" p="sm" style={{ background: 'var(--mantine-color-body)' }}>
            {loading ? (
                <Group gap={8} align="center">
                    <Loader size="sm" />
                    <Text size="sm" c="dimmed">Loading details…</Text>
                </Group>
            ) : (
                <Stack gap={12}>
                    <Group justify="space-between" align="center">
                        <Text size="sm" fw={600}>Source code</Text>
                        <Button size="xs" variant="light" leftSection={<IconCopy size={14} />} onClick={() => navigator.clipboard.writeText(String(s.source || ''))}>Copy code</Button>
                    </Group>
                    <Box style={CODE_PREVIEW_BOX}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{String(s.source || '').slice(0, 8000)}</pre>
                    </Box>

                    {/* Status-specific detail */}
                    {s.status === 'AC' && (<StatusAC />)}
                    {s.status === 'TLE' && (<StatusTLE />)}
                    {s.status === 'PENDING' && (<StatusPending />)}
                    {s.status === 'CE' && (
                        <StatusCE s={s} showMoreMap={showMoreMap} setShowMoreMap={setShowMoreMap} truncate={truncate} />
                    )}
                    {s.status === 'RTE' && (
                        <StatusRTE s={s} showMoreMap={showMoreMap} setShowMoreMap={setShowMoreMap} truncate={truncate} />
                    )}
                    {s.status === 'WA' && (
                        <StatusWA s={s} showMoreMap={showMoreMap} setShowMoreMap={setShowMoreMap} openInputMap={openInputMap} setOpenInputMap={setOpenInputMap} truncate={truncate} />
                    )}
                </Stack>
            )}
        </Paper>
    );
}

// Hook to manage submission expansion state, URL sync, and helpers
function useSubmissionExpansion() {
    const [expandedId, setExpandedId] = useState(null);
    const [loadingMap, setLoadingMap] = useState({});
    const [showMoreMap, setShowMoreMap] = useState({});
    const [openInputMap, setOpenInputMap] = useState({});
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (!searchParams || typeof searchParams.get !== 'function') return;
        const sid = searchParams.get('sid');
        if (sid) setExpandedId(sid);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function syncUrl(nextId) {
        try {
            const url = new URL(window.location.href);
            if (nextId) url.searchParams.set('sid', nextId); else url.searchParams.delete('sid');
            window.history.replaceState({}, '', url.toString());
        } catch {}
    }

    function toggleExpand(submission) {
        const willExpand = expandedId !== submission.id;
        const nextId = willExpand ? submission.id : null;
        setExpandedId(nextId);
        syncUrl(nextId);
        if (willExpand) {
            setLoadingMap((m) => ({ ...m, [submission.id]: true }));
            setTimeout(() => setLoadingMap((m) => ({ ...m, [submission.id]: false })), 300);
        }
    }

    function truncate(text, limit) {
        if (!text) return '';
        if (text.length <= limit) return text;
        return text.slice(0, limit) + '\n…';
    }

    return {
        expandedId,
        setExpandedId,
        loadingMap,
        setLoadingMap,
        showMoreMap,
        setShowMoreMap,
        openInputMap,
        setOpenInputMap,
        toggleExpand,
        truncate,
    };
}

function SubmissionList({ items = [], expandedId: _unusedExpandedId, onToggleExpand: _unusedOnToggle }) {
    const {
        expandedId,
        loadingMap,
        showMoreMap,
        setShowMoreMap,
        openInputMap,
        setOpenInputMap,
        toggleExpand,
        truncate,
    } = useSubmissionExpansionExt();

    return (
        <Stack gap="sm">
            {items.length === 0 && (
                <Text size="sm" c="dimmed">No submissions yet.</Text>
            )}
            {items.length > 0 && (
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th style={{ width: "40%", paddingLeft: 12 }}>Status</Table.Th>
                            <Table.Th style={{ width: "35%", paddingLeft: 12 }}>Language</Table.Th>
                            <Table.Th style={{ width: "25%", paddingLeft: 12 }}>Time</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {items.map((s, idx) => (
                            <SubmissionRowExt submission={s} onClick={() => toggleExpand(s)} key={s.id} index={idx}>
                                {expandedId === s.id && (
                                    <SubmissionDetailExt
                                        s={s}
                                        loading={!!loadingMap[s.id]}
                                        showMoreMap={showMoreMap}
                                        setShowMoreMap={setShowMoreMap}
                                        openInputMap={openInputMap}
                                        setOpenInputMap={setOpenInputMap}
                                        truncate={truncate}
                                    />
                                )}
                            </SubmissionRowExt>
                        ))}
                    </Table.Tbody>
                </Table>
            )}
        </Stack>
    );
}

function ToggleTags({ problem }) {
    const [opened, setOpened] = useState(false);
    const hasTags = Array.isArray(problem?.tags) && problem.tags.length > 0;
    if (!hasTags) return null;
    return (
        <Box>
            <Group justify="space-between" align="center">
                <Text size="sm" c="dimmed">Tags</Text>
                <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="gray"
                    onClick={() => setOpened((v) => !v)}
                    aria-expanded={opened}
                    aria-label="Toggle tags"
                >
                    {opened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                </ActionIcon>
            </Group>
            <Collapse in={opened}>
                <Box mt="xs">
                    <TagList tags={problem.tags} />
                </Box>
            </Collapse>
        </Box>
    );
}

function SampleInline({ samples = [] }) {
    if (!samples.length) return <Text c="dimmed">No samples provided.</Text>;

    return (
        <Stack gap="lg">
            {samples.map((s, idx) => {
                const input = s.input_text ?? s.input ?? "";
                const output = s.output_text ?? s.output ?? "";
                return (
                    <Stack key={idx} gap="xs">
                        <Text fw={600}>{`Sample ${idx + 1}`}</Text>

                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                            {/* INPUT BLOCK */}
                            <Stack gap={6}>
                                <Text c="dimmed" fw={600}>Input</Text>
                                <CopyPre text={input} style={CODE_BOX_STYLE} />
                            </Stack>

                            {/* OUTPUT BLOCK */}
                            <Stack gap={6}>
                                <Text c="dimmed" fw={600}>Output</Text>
                                <CopyPre text={output} style={CODE_BOX_STYLE} />
                            </Stack>
                        </SimpleGrid>

                    </Stack>
                );
            })}
        </Stack>
    );
}

function Section({ id, title, children, hideTitle = false }) {
    return (
        <Stack id={id} gap="sm">
            {!hideTitle && <Title order={3}>{title}</Title>}
            <Box>{children}</Box>
        </Stack>
    );
}

// Local markdown render components to normalize spacing without global CSS
const mdComponents = {
    p: ({ node, ...props }) => <p style={{ margin: '0 0 6px 0' }} {...props} />,
    ul: ({ node, ...props }) => <ul style={{ margin: '4px 0 6px', paddingLeft: '1.25rem' }} {...props} />,
    ol: ({ node, ...props }) => <ol style={{ margin: '4px 0 6px', paddingLeft: '1.25rem' }} {...props} />,
    h1: ({ node, ...props }) => <h1 style={{ margin: '8px 0 6px' }} {...props} />,
    h2: ({ node, ...props }) => <h2 style={{ margin: '8px 0 6px' }} {...props} />,
    h3: ({ node, ...props }) => <h3 style={{ margin: '6px 0 4px' }} {...props} />,
    h4: ({ node, ...props }) => <h4 style={{ margin: '6px 0 4px' }} {...props} />,
    h5: ({ node, ...props }) => <h5 style={{ margin: '6px 0 4px' }} {...props} />,
    h6: ({ node, ...props }) => <h6 style={{ margin: '6px 0 4px' }} {...props} />,
    li: ({ node, ...props }) => <li style={{ marginBottom: 4 }} {...props} />,
    code: ({ node, inline, className, children, ...props }) => {
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

export default function ProblemPage({ problem: incomingProblem, onSubmit, defaultLang }) {
    const params = useParams();
    // For deep-linking expanded submission
    const [searchParams] = useSearchParams();
    // Fallback demo data for local preview
    const [fetchedProblem, setFetchedProblem] = useState(null);
    const [loading, setLoading] = useState(!incomingProblem);
    const [expandedSubmissionId, setExpandedSubmissionId] = useState(null);

    useEffect(() => {
        const slug = params?.slug;
        if (!incomingProblem && slug) {
            setLoading(true);
            getProblem(slug)
              .then(setFetchedProblem)
              .catch(() => setFetchedProblem(null))
              .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [incomingProblem, params?.slug]);

    // Initialize expanded submission from URL (?sid=...)
    useEffect(() => {
        if (!searchParams || typeof searchParams.get !== 'function') return;
        const sid = searchParams.get('sid');
        if (sid) setExpandedSubmissionId(sid);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const problem = useMemo(
        () => incomingProblem || fetchedProblem || {},
        [incomingProblem, fetchedProblem]
    );

    // Fetch submissions for this problem
    useEffect(() => {
        if (!problem.id) return;
        
        // Clean up any existing polling intervals before loading new submissions
        Object.values(pollingIntervalsRef.current).forEach((interval) => {
            clearInterval(interval);
        });
        pollingIntervalsRef.current = {};
        
        listSubmissions({ problem_id: problem.id })
            .then((res) => {
                // Transform submissions to match expected format
                const formattedSubmissions = (res.submissions || []).map((s) => {
                    const base = {
                        id: s.id,
                        when: s.submitted_at || s.submittedAt ? new Date(s.submitted_at || s.submittedAt).toLocaleString() : new Date().toLocaleString(),
                    };
                    
                    // Transform additional fields using the transformation function
                    const transformed = transformSubmissionData(s);
                    
                    return { ...base, ...transformed };
                });
                
                setSubmissions(formattedSubmissions);
                
                // Start polling for any pending or running submissions
                formattedSubmissions.forEach((sub) => {
                    if (sub.status === 'PENDING' || sub.status === 'RUNNING') {
                        pollSubmissionStatus(sub.id);
                    }
                });
            })
            .catch((error) => {
                console.error('Failed to fetch submissions:', error);
                setSubmissions([]);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [problem.id]);

    // State for selected language and source code
    const [lang, setLang] = useState(defaultLang ?? null);
    const [source, setSource] = useState("");
    // Left pane tab & local submissions list
    const [leftTab, setLeftTab] = useState('problem');
    const [submissions, setSubmissions] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    
    // Track polling intervals for cleanup
    const pollingIntervalsRef = useRef({});
    // CodeMirror language extensions based on selected lang (only language modes)
    const extensions = useMemo(() => {
        switch (lang) {
            case 'cpp17':
                return [cpp()];
            case 'java17':
                return [java()];
            case 'py310':
                return [python()];
            default:
                return [];
        }
    }, [lang]);

    const memLimit =
        problem.memory_limit_mb !== undefined && problem.memory_limit_mb !== null
            ? `${problem.memory_limit_mb} MB`
            : undefined;
    const accRate =
        problem.acceptance_rate !== undefined && problem.acceptance_rate !== null
            ? `${Number(problem.acceptance_rate).toFixed(1)}%`
            : undefined;
    const timeLimit =
        problem.time_limit !== undefined && problem.time_limit !== null
            ? `${problem.time_limit} s`
            : undefined;

    // Normalize status to uppercase to match component expectations
    const normalizeStatus = (status) => {
        if (!status) return 'PENDING';
        const upper = status.toUpperCase();
        // Map common status formats
        if (upper === 'PENDING' || upper === 'QUEUED') return 'PENDING';
        if (upper === 'RUNNING') return 'RUNNING';
        if (upper === 'ACCEPTED' || upper === 'AC') return 'AC';
        if (upper === 'WRONG_ANSWER' || upper === 'WA') return 'WA';
        if (upper === 'TIME_LIMIT_EXCEEDED' || upper === 'TLE') return 'TLE';
        if (upper === 'COMPILATION_ERROR' || upper === 'CE') return 'CE';
        if (upper === 'RUNTIME_ERROR' || upper === 'RTE') return 'RTE';
        if (upper === 'MEMORY_LIMIT_EXCEEDED' || upper === 'MLE') return 'MLE';
        if (upper === 'PARTIAL') return 'PARTIAL';
        if (upper === 'SYSTEM_ERROR') return 'SYSTEM_ERROR';
        return upper;
    };

    // Helper function to transform API submission to UI format
    const transformSubmissionData = (submission) => {
        let status = normalizeStatus(submission.status);
        const transformed = {
            status,
        };
        
        // Basic fields
        if (submission.language || submission.lang) {
            transformed.lang = submission.language || submission.lang;
        }
        if (submission.code || submission.source) {
            transformed.source = submission.code || submission.source;
        }
        
        // Compilation error log
        if (submission.compile_log) {
            transformed.compileLog = submission.compile_log;
            // If there's a compile log, status should be CE
            status = 'CE';
        }
        
        // Runtime error - map run_log to runtimeError (StatusRTE expects runtimeError)
        if (submission.run_log) {
            transformed.runtimeError = submission.run_log;
            // If there's a run_log and no compile_log, treat as RTE
            // (backend might return "wrong_answer" for runtime errors)
            if (!submission.compile_log) {
                status = 'RTE';
            }
        }
        
        // Update status in transformed object
        transformed.status = status;
        
        // Test case results - transform to failedCases format for WA
        if (submission.test_case_results && Array.isArray(submission.test_case_results)) {
            // Store raw test case results
            transformed.testCaseResults = submission.test_case_results;
            
            // For wrong_answer status (and not RTE/CE), create failedCases from test_case_results
            if (status === 'WA') {
                transformed.failedCases = submission.test_case_results
                    .filter(tc => {
                        const tcStatus = tc.status?.toLowerCase();
                        return tcStatus !== 'accepted' && tcStatus !== 'passed';
                    })
                    .map((tc, idx) => ({
                        id: String(tc.id || tc.test_case_id || `tc_${idx}`),
                        summary: tc.test_case?.name || `Test case ${idx + 1}`,
                        input: tc.input || '',
                        your: tc.your_output || tc.output || '',
                        expected: tc.expected_output || '',
                        diffLines: tc.diff_lines || { left: [], right: [] },
                    }));
            }
        }
        
        // Summary and stats
        if (submission.summary) {
            transformed.summary = submission.summary;
        }
        if (submission.score !== undefined) {
            transformed.score = submission.score;
        }
        if (submission.execution_time !== undefined) {
            transformed.executionTime = submission.execution_time;
        }
        if (submission.memory_usage !== undefined) {
            transformed.memoryUsage = submission.memory_usage;
        }
        if (submission.code_size_bytes !== undefined) {
            transformed.codeSizeBytes = submission.code_size_bytes;
        }
        
        return transformed;
    };

    // Update a submission in the list
    const updateSubmissionInList = (submissionId, updates) => {
        setSubmissions((prev) => {
            const submissionIdStr = String(submissionId);
            const found = prev.find((sub) => String(sub.id) === submissionIdStr);
            
            if (!found) {
                console.warn('Submission not found in list:', submissionId, 'Available IDs:', prev.map(s => s.id));
                return prev;
            }
            
            const updated = prev.map((sub) => {
                if (String(sub.id) === submissionIdStr) {
                    const merged = { ...sub, ...updates };
                    console.log('Updating submission:', sub.id, 'Status:', sub.status, '->', merged.status);
                    return merged;
                }
                return sub;
            });
            
            console.log('Updated submissions list. Count:', updated.length);
            return updated;
        });
    };

    // Poll submission status until it's complete
    const pollSubmissionStatus = (submissionId) => {
        // Clear any existing polling for this submission
        if (pollingIntervalsRef.current[submissionId]) {
            clearInterval(pollingIntervalsRef.current[submissionId]);
        }

        const poll = async () => {
            try {
                const submission = await getSubmission(submissionId);
                console.log('Polling submission:', submissionId, 'Raw response:', submission);
                
                // Transform the API response to UI format
                const updates = transformSubmissionData(submission);
                
                console.log('Updating submission with:', updates);
                
                // Update submission in list
                updateSubmissionInList(submissionId, updates);
                
                // Stop polling if status is not pending or running
                const status = updates.status;
                if (status !== 'PENDING' && status !== 'RUNNING') {
                    console.log('Stopping polling for submission:', submissionId, 'Final status:', status);
                    if (pollingIntervalsRef.current[submissionId]) {
                        clearInterval(pollingIntervalsRef.current[submissionId]);
                        delete pollingIntervalsRef.current[submissionId];
                    }
                }
            } catch (error) {
                console.error('Failed to poll submission status:', error);
                // Stop polling on error
                if (pollingIntervalsRef.current[submissionId]) {
                    clearInterval(pollingIntervalsRef.current[submissionId]);
                    delete pollingIntervalsRef.current[submissionId];
                }
            }
        };

        // Poll immediately, then every 1.5 seconds
        poll();
        pollingIntervalsRef.current[submissionId] = setInterval(poll, 1500);
    };

    // Cleanup polling intervals on unmount
    useEffect(() => {
        return () => {
            // Clear all polling intervals
            Object.values(pollingIntervalsRef.current).forEach((interval) => {
                clearInterval(interval);
            });
            pollingIntervalsRef.current = {};
        };
    }, []);

    // Keyboard shortcut: Ctrl+Enter to submit
    useEffect(() => {
        function onKey(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
            }
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lang, source, problem]);

    function handleSubmit() {
        // Validate inputs
        if (!lang || !source.trim() || !problem.id) {
            console.error('Missing required fields for submission');
            return;
        }

        // Call parent onSubmit if provided (for compatibility)
        if (typeof onSubmit === "function") onSubmit({ lang, source, problem });

        // Set submitting state
        setSubmitting(true);

        // Submit to API
        submitProblem(problem.id, { lang, source })
            .then((submission) => {
                // Transform submission to match expected format
                const base = {
                    id: submission.id,
                    when: submission.submitted_at || submission.submittedAt ? new Date(submission.submitted_at || submission.submittedAt).toLocaleString() : new Date().toLocaleString(),
                };
                
                // Transform additional fields using the transformation function
                const transformed = transformSubmissionData(submission);
                
                // Ensure source is set (use submitted source if API doesn't return it)
                if (!transformed.source && source) {
                    transformed.source = source;
                }
                
                const formattedSubmission = { ...base, ...transformed };
                
                // Add submission to list and switch to submissions tab
                setSubmissions((prev) => [formattedSubmission, ...prev]);
                setLeftTab('submissions');
                
                // Start polling for status updates if status is pending or running
                if (formattedSubmission.status === 'PENDING' || formattedSubmission.status === 'RUNNING') {
                    pollSubmissionStatus(submission.id);
                }
            })
            .catch((error) => {
                console.error('Submission failed:', error);
                // Still add a pending submission to show something happened
                const created = {
                    id: `local_${Date.now()}`,
                    when: new Date().toLocaleString(),
                    lang,
                    status: 'ERROR',
                    source,
                };
                setSubmissions((prev) => [created, ...prev]);
                setLeftTab('submissions');
            })
            .finally(() => {
                setSubmitting(false);
            });
    }

    const isLoading = !incomingProblem && loading;

    return (
        <Box
            maw={1800}
            mx="auto"
            style={{
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
            }}
        >
            {/* Breadcrumbs intentionally removed to avoid hints */}

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing='sm' style={{ flex: 1, minHeight: 0 }}>
                {/* LEFT: TITLE + META + STATEMENT (all metadata lives here) */}
                <Paper withBorder p={0} radius="md" className="problem-content" style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    {/* Left pane header: fixed, isolated from content padding */}
                    <PaneHeaderBar>
                        <LeftTabsHeader leftTab={leftTab} setLeftTab={setLeftTab} />
                    </PaneHeaderBar>
                    {/* Bleed right to align scrollbar with Paper border by offsetting content padding */}
                    <ScrollArea
                        style={{
                            flex: 1,
                            minHeight: 0,
                            // Cancel Paper padding-right so scrollbar hugs the border
                            marginRight: 'calc(-1 * var(--mantine-spacing-lg) + 16)',
                        }}
                    >
                        <Stack gap="lg" style={{ padding: 'var(--mantine-spacing-lg)', paddingRight: 'var(--mantine-spacing-lg)' }}>
                            {isLoading ? (
                                <>
                                    <Skeleton height={28} width="60%" />
                                    <Group gap="sm">
                                        <Skeleton height={22} width={72} />
                                        <Skeleton height={22} width={80} />
                                    </Group>
                                    <Group gap="lg">
                                        <Skeleton height={18} width={120} />
                                        <Skeleton height={18} width={120} />
                                        <Skeleton height={18} width={120} />
                                    </Group>
                                    <Skeleton height={12} width="90%" />
                                    <Skeleton height={12} width="85%" />
                                    <Skeleton height={12} width="80%" />
                                </>
                            ) : leftTab === 'problem' ? (
                            <>
                            {/* Title */}
                            <Group align="center" gap="sm" wrap="wrap">
                                <Title order={1} style={{ lineHeight: 1.15 }}>{problem.title}</Title>
                            </Group>
                            {/* Difficulty and solved */}
                            <Group align="center" gap="sm" wrap="nowrap">
                                <DifficultyBadge level={problem.difficulty} />
                                {problem.solved_by_me && (
                                    <Badge leftSection={<IconChecks size={14} />} color="teal" variant="light" size="md" radius="xl">
                                        Solved
                                    </Badge>
                                )}
                            </Group>
                            {/* Meta */}
                            <Group gap="lg" wrap="wrap">
                                <MetaRow
                                    icon={<IconClock size={16} />}
                                    label="Time limit"
                                    value={timeLimit}
                                    tooltip="Maximum time (seconds) allowed during grading"
                                />
                                <MetaRow
                                    icon={<IconCpu size={16} />}
                                    label="Memory limit"
                                    value={memLimit}
                                    tooltip="Maximum resident memory (RSS) allowed during grading"
                                />
                                <MetaRow
                                    icon={<IconInfoCircle size={16} />}
                                    label="Acceptance"
                                    value={accRate}
                                    tooltip="Acceptance rate"
                                />
                            </Group>
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

                            {problem.samples && problem.samples.length > 0 && (
                                <Section id="samples" title="Samples">
                                    <SampleInline samples={problem.samples} />
                                </Section>
                            )}

                            <ToggleTags problem={problem} />
                            </>
                            ) : (
                                <SubmissionList
                                    items={submissions}
                                    expandedId={expandedSubmissionId}
                                    onToggleExpand={setExpandedSubmissionId}
                                />
                            )}
                        </Stack>
                    </ScrollArea>
                </Paper>

                {/* RIGHT: SUBMIT PANEL (fixed-height, internal scroll) */}
                <Box style={{ height: '100%', minHeight: 0 }}>
                    <Paper withBorder p={0} radius="md" style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        {/* Right pane header: fixed, isolated from content padding */}
                        <PaneHeaderBar>
                            <PaneHeader>
                                <IconCode size={16} style={{ color: 'var(--mantine-color-dimmed)' }} />
                                <Text fw={600} c="dimmed" size="sm" style={{ lineHeight: 1 }}>Editor</Text>
                            </PaneHeader>
                        </PaneHeaderBar>
                        {/* Bleed right to align scrollbar with Paper border by offsetting p="lg" */}
                        <ScrollArea
                            style={{
                                flex: 1,
                                minHeight: 0,
                                // Cancel Paper padding-right so scrollbar hugs the border
                                marginRight: 'calc(-1 * var(--mantine-spacing-lg) + 16)',
                            }}
                        >
                            <Stack gap="md" style={{ padding: 'var(--mantine-spacing-lg)', paddingRight: 'var(--mantine-spacing-lg)' }}>
                                {isLoading ? (
                                    <>
                                        <Skeleton height={34} width={200} />
                                        <Skeleton height={320} />
                                    </>
                                ) : (
                                    <>
                                        <Select
                                            data={[
                                                { value: LANG_LABEL_VALUE, label: "Language", disabled: true },
                                                { value: "cpp17", label: "C++17" },
                                                { value: "java17", label: "Java 17" },
                                                { value: "py310", label: "Python 3.10" },
                                            ]}
                                            value={lang ?? LANG_LABEL_VALUE}
                                            onChange={(v) => { if (v && v !== LANG_LABEL_VALUE) setLang(v); }}
                                            allowDeselect={false}
                                            size="xs"
                                            radius={8}
                                            style={{ width: 120 }}
                                        />
                                        <CodeMirror
                                            basicSetup={lang === 'py310' ? { autocompletion: false } : true}
                                            value={source}
                                            height="400px"
                                            extensions={extensions}
                                            onChange={(value) => setSource(value)}
                                            placeholder={
                                                !lang
                                                    ? "// choose a language from the dropdown to enable syntax highlighting"
                                                    : lang === "cpp17"
                                                        ? "// paste or write your C++17 solution here"
                                                        : lang === "java17"
                                                            ? "// paste or write your Java 17 solution here"
                                                            : "# paste or write your Python 3.10 solution here"
                                            }
                                        />
                                    </>
                                )}
                            </Stack>
                        </ScrollArea>
                        {/* Sticky footer: visible while editor content scrolls */}
                        <Box style={{ borderTop: '1px solid var(--mantine-color-default-border)', padding: 'var(--mantine-spacing-sm) var(--mantine-spacing-lg)' }}>
                            {isLoading ? (
                                <Skeleton height={32} width={100} />
                            ) : (
                                <Group justify="space-between" wrap="wrap">
                                    <Text size="xs" c="dimmed">Press Ctrl+Enter (⌘+Enter on Mac) to submit</Text>
                                    <Button 
                                        leftSection={<IconSend size={16} />} 
                                        onClick={handleSubmit}
                                        loading={submitting}
                                        disabled={submitting || !lang || !source.trim() || !problem.id}
                                    >
                                        Submit
                                    </Button>
                                </Group>
                            )}
                        </Box>
                    </Paper>
                </Box>
            </SimpleGrid>
        </Box>
    );
}
