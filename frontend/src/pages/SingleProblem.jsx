import React, { useMemo, useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import { getProblem } from '../lib/api/problems';
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
} from "@tabler/icons-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import CopyPre from "../components/CopyPre";
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

const PANE_HEADER_H = 32;

// Shared styles
const headerButtonStyle = (active) => ({
    fontWeight: 600,
    height: PANE_HEADER_H,
    paddingInline: 8,
    fontSize: 'var(--mantine-font-size-sm)',
    lineHeight: 1,
    borderBottom: active ? '2px solid var(--mantine-color-gray-6)' : '2px solid transparent',
    borderRadius: 0,
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

function PaneHeader({ children }) {
    return (
        <Group
            gap={8}
            wrap="nowrap"
            align="center"
            style={{ height: PANE_HEADER_H, borderBottom: '1px solid var(--mantine-color-default-border)', marginTop: 4, marginBottom: 24 }}
        >
            {children}
        </Group>
    );
}

function LeftTabsHeader({ leftTab, setLeftTab }) {
    return (
        <PaneHeader>
            <Button
                variant="subtle"
                size="xs"
                color="gray"
                style={headerButtonStyle(leftTab === 'problem')}
                onClick={() => setLeftTab('problem')}
                leftSection={<IconFileText size={16} />}
            >
                Problem
            </Button>
            <Button
                variant="subtle"
                size="xs"
                color="gray"
                style={headerButtonStyle(leftTab === 'submissions')}
                onClick={() => setLeftTab('submissions')}
                leftSection={<IconListCheck size={16} />}
            >
                Submissions
            </Button>
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

function SubmissionList({ items = [] }) {
    return (
        <Stack gap="sm">
            {items.length === 0 && (
                <Text size="sm" c="dimmed">No submissions yet.</Text>
            )}
            {items.map((s) => (
                <Group
                    key={s.id}
                    justify="space-between"
                    wrap="nowrap"
                    style={{
                        background: 'var(--mantine-color-gray-0)',
                        borderRadius: 8,
                        padding: '8px 12px',
                    }}
                >
                    <Group gap={8} wrap="nowrap">
                        <Badge variant="light" color="gray" radius="sm">{s.status}</Badge>
                        <Text size="sm" c="dimmed">{s.lang}</Text>
                    </Group>
                    <Text size="sm" c="dimmed">{s.when}</Text>
                </Group>
            ))}
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

export default function ProblemPage({ problem: incomingProblem, onSubmit, defaultLang }) {
    const params = useParams();
    // Fallback demo data for local preview
    const [fetchedProblem, setFetchedProblem] = useState(null);
    const [loading, setLoading] = useState(!incomingProblem);

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

    const problem = useMemo(
        () => incomingProblem || fetchedProblem || {},
        [incomingProblem, fetchedProblem]
    );
    // State for selected language and source code
    const [lang, setLang] = useState(defaultLang || "cpp17");
    const [source, setSource] = useState("");
    // Left pane tab & local submissions list
    const [leftTab, setLeftTab] = useState('problem');
    const [submissions, setSubmissions] = useState([]);
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
        if (typeof onSubmit === "function") onSubmit({ lang, source, problem });
        const created = { id: `local_${Date.now()}`, when: new Date().toLocaleString(), lang, status: 'PENDING' };
        setSubmissions((prev) => [created, ...prev]);
        setLeftTab('submissions');
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
                <Paper withBorder p="lg" radius="md" className="problem-content" style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, paddingTop: 0 }}>
                    {/* Left pane header: fixed */}
                    <LeftTabsHeader leftTab={leftTab} setLeftTab={setLeftTab} />
                    {/* Bleed right to align scrollbar with Paper border by offsetting p="lg" padding */}
                    <ScrollArea
                        style={{
                            flex: 1,
                            minHeight: 0,
                            // Cancel Paper padding-right so scrollbar hugs the border
                            marginRight: 'calc(-1 * var(--mantine-spacing-lg))',
                        }}
                    >
                        <Stack gap="lg" style={{ paddingRight: 'var(--mantine-spacing-lg)' }}>
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
                                <Box style={{ fontFamily: 'Inter, sans-serif' }}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {problem.statement?.overview || ''}
                                    </ReactMarkdown>
                                </Box>
                            </Section>

                            <Section id="input" title="Input">
                                <Box style={{ fontFamily: 'Inter, sans-serif' }}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {problem.statement?.input || ''}
                                    </ReactMarkdown>
                                </Box>
                            </Section>

                            <Section id="output" title="Output">
                                <Box style={{ fontFamily: 'Inter, sans-serif' }}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {problem.statement?.output || ''}
                                    </ReactMarkdown>
                                </Box>
                            </Section>

                            <Section id="constraints" title="Constraints">
                                <List spacing="xs" withPadding>
                                    {Array.isArray(problem.statement?.constraints)
                                        ? problem.statement.constraints.map((c, i) => (
                                            <List.Item key={i}>
                                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                    {c}
                                                </ReactMarkdown>
                                            </List.Item>
                                        ))
                                        : String(problem.statement?.constraints)
                                            .split(";")
                                            .filter(Boolean)
                                            .map((c, i) => (
                                                <List.Item key={i}>
                                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                        {c.trim()}
                                                    </ReactMarkdown>
                                                </List.Item>
                                            ))}
                                </List>
                            </Section>

                            <Section id="samples" title="Samples">
                                <SampleInline samples={problem.samples} />
                            </Section>

                            <ToggleTags problem={problem} />
                            </>
                            ) : (
                                <SubmissionList items={submissions} />
                            )}
                        </Stack>
                    </ScrollArea>
                </Paper>

                {/* RIGHT: SUBMIT PANEL (fixed-height, internal scroll) */}
                <Box style={{ height: '100%', minHeight: 0 }}>
                    <Paper withBorder p="lg" radius="md" style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, paddingTop: 0 }}>
                        {/* Right pane header: fixed */}
                        <PaneHeader>
                            <IconCode size={16} style={{ color: 'var(--mantine-color-dimmed)' }} />
                            <Text fw={600} c="dimmed" size="sm" style={{ lineHeight: 1 }}>Editor</Text>
                        </PaneHeader>
                        {/* Bleed right to align scrollbar with Paper border by offsetting p="lg" */}
                        <ScrollArea
                            style={{
                                flex: 1,
                                minHeight: 0,
                                // Cancel Paper padding-right so scrollbar hugs the border
                                marginRight: 'calc(-1 * var(--mantine-spacing-lg))',
                            }}
                        >
                            <Stack gap="md" style={{ paddingRight: 'var(--mantine-spacing-lg)' }}>
                                {isLoading ? (
                                    <>
                                        <Skeleton height={34} width={200} />
                                        <Skeleton height={320} />
                                    </>
                                ) : (
                                    <>
                                        <Select
                                            label="Language"
                                            data={[
                                                { value: "cpp17", label: "C++17" },
                                                { value: "java17", label: "Java 17" },
                                                { value: "py310", label: "Python 3.10" },
                                            ]}
                                            value={lang}
                                            onChange={setLang}
                                            allowDeselect={false}
                                        />
                                        <CodeMirror
                                            basicSetup={lang === 'py310' ? { autocompletion: false } : true}
                                            value={source}
                                            height="400px"
                                            extensions={extensions}
                                            onChange={(value) => setSource(value)}
                                            placeholder={
                                                lang === "cpp17"
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
                                    <Button leftSection={<IconSend size={16} />} onClick={handleSubmit}>
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
